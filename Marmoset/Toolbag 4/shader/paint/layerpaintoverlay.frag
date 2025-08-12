
uniform vec4	uBrushMarker;	// { u, v, size, sharpness }
uniform float 	uTargetAspect;  //needed for UV mode
uniform vec3	uColor0, uColor1;
uniform float	uAlpha;
uniform int		uPaintMode;
USE_TEXTURE2D(tBrushTexture);

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)
	INPUT1(vec3,fBrushCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{

	float feather = 0.0;
	float depth = fBrushCoord.z;
	if( uPaintMode == 1 )
	{
		//3d brush painting
		vec2 localTexCoord = fBrushCoord.xy * 0.5 * 0.9 + 0.5;
		vec2 dty = dFdy(localTexCoord);
		vec2 dtx = dFdx(localTexCoord);
		float fUp = texture2D(tBrushTexture, localTexCoord+dty).a;
		float fDown = texture2D(tBrushTexture, localTexCoord-dty).a;
		float fLeft = texture2D(tBrushTexture, localTexCoord-dtx).a;
		float fRight = texture2D(tBrushTexture, localTexCoord+dtx).a;
		
		//make sure we're actually in the brush region and aren't crossing a major UV jump
		float inSplot = step(0.0, localTexCoord.x) * step(0.0, localTexCoord.y);
		inSplot *= (1.0-step(1.0, localTexCoord.x)) * (1.0-step(1.0, localTexCoord.y));
		inSplot *= 1.0 - step(1.5, abs(fBrushCoord.z));
//		inSplot *= 1.0- step(0.1, max(length(dtx), length(dty)));
				
		//preview the brush outline by finding edges
		//sort these for fewer if statements
		float maxV = max(fUp, fDown);
		float minV = min(fUp, fDown);
		float maxH = max(fLeft, fRight);
		float minH = min(fLeft, fRight);
		float fval = 0.0;
		float thresh = 0.1;
		if((minV <= thresh && maxV > thresh) || (minH <= thresh && maxH > thresh))
			fval = 1.0;
//		if(feather <= 0.5 && feather + dfx > 0.5)
//			fval = 1.0;
		feather = fval * inSplot;
		
	}
	else if( uPaintMode == 0 )
	{
		//uv painting
		
		//brush space texture coordinate for our brush splot
		vec2 localTexCoord = (frac(fTexCoord)-uBrushMarker.xy) / uBrushMarker.z * 0.9 * 0.5;
		localTexCoord.x *= clamp(uTargetAspect, 0.001, 1000.0);
		localTexCoord += vec2(0.5, 0.5);
		vec2 dty = dFdy(localTexCoord);
		vec2 dtx = dFdx(localTexCoord);
		float fUp = texture2D(tBrushTexture, localTexCoord+dty).a;
		float fDown = texture2D(tBrushTexture, localTexCoord-dty).a;
		float fLeft = texture2D(tBrushTexture, localTexCoord-dtx).a;
		float fRight = texture2D(tBrushTexture, localTexCoord+dtx).a;
		
		//make sure we're actually in the brush region and aren't crossing a major UV jump
		float inSplot = step(0.0, localTexCoord.x) * step(0.0, localTexCoord.y);
		inSplot *= (1.0-step(1.0, localTexCoord.x)) * (1.0-step(1.0, localTexCoord.y));
		inSplot *= 1.0- step(0.1, max(length(dtx), length(dty)));
				
		//sort these for fewer if statements
		float maxV = max(fUp, fDown);
		float minV = min(fUp, fDown);
		float maxH = max(fLeft, fRight);
		float minH = min(fLeft, fRight);
		float fval = 0.0;
		float thresh = 0.1;
		if((minV <= thresh && maxV > thresh) || (minH <= thresh && maxH > thresh))
			fval = 1.0;
		
		feather = fval * inSplot;
	}
	if(feather <= 0.01)
		discard;
	
	OUT_COLOR0 = mix( vec4(0.0, 0.0, 0.0, 0.0), vec4( .2, .2, .4, 0.4 ), feather );

}
