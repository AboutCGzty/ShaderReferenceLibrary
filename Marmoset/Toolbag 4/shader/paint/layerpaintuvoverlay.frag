
uniform vec4	uBrushMarker;	// { u, v, size, sharpness }
uniform vec3	uColor0, uColor1;
uniform float	uAlpha;
uniform int		uPaintMode;
USE_TEXTURE2D(tBrushTexture);

BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{

	float feather = 0.0;
	
	
	//uv painting
	
	//brush space texture coordinate for our brush splot
	vec2 localTexCoord = fTexCoord.xy;//vec2(0.5, 0.5) + (frac(fTexCoord)-uBrushMarker.xy) / uBrushMarker.z * 0.9;
	vec2 dty = dFdy(localTexCoord);
	vec2 dtx = dFdx(localTexCoord);
	float fUp = texture2D(tBrushTexture, localTexCoord+dty).a;
	float fDown = texture2D(tBrushTexture, localTexCoord-dty).a;
	float fLeft = texture2D(tBrushTexture, localTexCoord-dtx).a;
	float fRight = texture2D(tBrushTexture, localTexCoord+dtx).a;
	
	//make sure we're actually in the brush region
	float inSplot = step(0.0, localTexCoord.x) * step(0.0, localTexCoord.y);
	inSplot *= (1.0-step(1.0, localTexCoord.x)) * (1.0-step(1.0, localTexCoord.y));
	
	//sort these for fewer if statements
	float maxV = max(fUp, fDown);
	float minV = min(fUp, fDown);
	float maxH = max(fLeft, fRight);
	float minH = min(fLeft, fRight);
	float fval = 0.0;
	float thresh = 0.1;
	if((minV <= thresh && maxV > thresh) || (minH <= thresh && maxH > thresh))
	{
		fval = 1.0;
	}

	feather = fval * inSplot;
	if(feather <= 0.01)
	{
		discard;
	}
	OUT_COLOR0 = mix( vec4(0.0, 0.0, 0.0, 0.0), vec4( 1.0, 1.0, 1.0, 1.0 ), feather );
}
