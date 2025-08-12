
#include "../paintcompositeutil.sh"


uniform int uErasing;
uniform int uSingleChannel;
uniform vec4 uColor;
uniform int uReadUVs; 
USE_TEXTURE2D(tStroke); 
USE_TEXTURE2D(tExisting); 
USE_TEXTURE2D(tUV); 

//convert between RGBA and RG-as-RA textures
void toRGBA(inout vec4 c)
{	c = mix(c, c.rrrg, float(uSingleChannel)); }

void toNativeChannels(inout vec4 c)
{	c = mix(c, c.ragg, float(uSingleChannel)); }

void extrapInDirection(inout vec3 uvr,  vec2 coord, vec2 dU)
{
	vec2 t1 = texture2D(tUV, coord+dU).yz;
	vec2 t2 = texture2D(tUV, coord+dU*2.0).yz;
	if(length(t1) > 0.0 && length(t2) > 0.0)
	{
		vec2 nuv = t1 + (t1-t2); 
		float rate = length(t1-t2);
		rate = 1.0;
		if(length(nuv) > 0.01)
		{ uvr += vec3(nuv, 1.0) / max(rate, 0.0001); }
	}
}

vec4 paintStrokeCull(inout vec2 surfaceCoord)
{
	int w;
	int h;
	int mips;
	imageSize2D(tUV, w, h, mips);

	vec2 dUVx = vec2(1.0 / float(w), 0.0);
	vec2 dUVy = vec2(0.0, 1.0 / float(w));
	vec4 stroke = texture2D(tStroke, surfaceCoord);
	if(stroke.g < 0.0001)	//here, stroke.g is the cumulative mask
	{ discard; }


	vec2 uv = texture2D(tUV, surfaceCoord).yz;

	if(length(uv) == 0.0 && uReadUVs != 0)
	{
		//we may need to do some last-moment texture padding across UV seams
		vec3 uvr = vec3(0.0, 0.0, 0.0);
		
		extrapInDirection(uvr, surfaceCoord, dUVx);
		extrapInDirection(uvr, surfaceCoord, -dUVx);
		extrapInDirection(uvr, surfaceCoord, dUVy);
		extrapInDirection(uvr, surfaceCoord, -dUVy);
		
 		extrapInDirection(uvr, surfaceCoord+dUVx, dUVx);
		extrapInDirection(uvr, surfaceCoord-dUVx, -dUVx);
		extrapInDirection(uvr, surfaceCoord+dUVy, dUVy);
		extrapInDirection(uvr, surfaceCoord-dUVy, -dUVy);		
		if(uvr.z > 0.0)
		{ uv = uvr.xy / uvr.z; }

	}
	surfaceCoord = mix(surfaceCoord, uv.xy, float(uReadUVs));
	
	return stroke;
}

void paintStrokeComposite(vec4 stroke, vec2 surfaceCoord, vec2 dUVx, vec2 dUVy, inout vec4 result)
{
		vec4 existing = texture2D(tExisting, surfaceCoord);
		toRGBA(existing);
	
		//transform normals if the brush is rotated.  This method appears to work.
		#if LAYER_OUTPUT == CHANNEL_NORMAL
			vec3 norm = result.rgb * 2.0 - 1.0;
			float mag = length(norm.xy);

			//if the UVs are wrapped in reverse, we need to modify our little trick
			if(dUVx.x*dUVy.y - dUVx.y*dUVy.x < 0.0)
			{
				dUVx.y *= -1.0;
				dUVy.x *= -1.0;
			}
			norm.yx = vec2(-dUVx.y, dUVx.x) * norm.x * uOutputSize.x + vec2(dUVy.y, -dUVy.x) * norm.y * uOutputSize.y;
			
			norm.xy = norm.xy / max(length(norm.xy), 0.00001) * mag;
			result.rgb = norm.rgb * 0.5 + 0.5; 
		#endif
		float alpha = stroke.r;
		result.a *= alpha;
		result *= uColor;
		
		result = blendRGBA(existing, result);
		vec4 eraseColor = vec4(existing.rgb, existing.a * (1.0-alpha));

		//full opacity erase goes to 0, 0, 0, 0
		eraseColor = mix(eraseColor, vec4(0, 0, 0, 0), step(0.995, alpha));
		result = mix(result, eraseColor, float(uErasing));
		
		//convert to linear colorspace before dithering
		#ifndef LAYER_OUTPUT_16BIT		
			#ifdef LAYER_OUTPUT_SRGB		
			result.rgb = linearTosRGBApprox(result.rgb);
			#endif
			result = layerDither8bitRGBA( result, surfaceCoord + uLayerDitherSeed );
			#ifdef LAYER_OUTPUT_SRGB
			result.rgb = sRGBToLinearApprox(result.rgb);
			#endif
		#endif
		
		//revert to previous color if we actually had zero alpha to avoid data degradation from the srgb-linear-srgb conversion
		if(alpha == 0.0)
		{ result = existing; }
		toNativeChannels(result);
}
