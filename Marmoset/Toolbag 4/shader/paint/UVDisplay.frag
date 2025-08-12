
BEGIN_PARAMS
	INPUT0(vec2,fTexCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{

	float dtdx = length(dFdx(fTexCoord.xy));
	float dtdy = length(dFdy(fTexCoord.xy));
	float dtdP = min(dtdx, dtdy);
//	dtdP = length(dtdy);
	float targetSize = 4096.0;
	float pixelsPerTexel = 1.0 / (max(dtdP, 0.00001) * targetSize);
	pixelsPerTexel = dtdP * targetSize;
	pixelsPerTexel = ceil(pixelsPerTexel - 0.5);
	vec2 tc = fTexCoord.xy;
	tc = mod(tc, 1.0);
	pixelsPerTexel = clamp((pixelsPerTexel) * 0.125, 0.0, 1.0);
	OUT_COLOR0 = vec4(tc, pixelsPerTexel, 1.0 );
//	OUT_COLOR0.rgb = vec3(pixelsPerTexel);
	 

}
