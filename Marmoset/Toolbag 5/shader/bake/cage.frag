USE_TEXTURE2D(tCagePositions);

HINT_EARLYDEPTHSTENCIL
BEGIN_PARAMS
	INPUT0(vec3,fPosition)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec3 cagePosition = imageLoad( tCagePositions, uint2(IN_POSITION.xy) ).xyz;
	OUT_COLOR0.x = length( fPosition - cagePosition );
	OUT_COLOR0.yzw = vec3( 0, 0, 0 );
}
