USE_LOADSTORE_BUFFER(vec4, bPositions, 1);

uniform uint uRowWidth;

BEGIN_PARAMS
	INPUT0(vec3,fPosition)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	//write position to buffer, in row-major order
	uint index = IN_POSITION.y * uRowWidth + IN_POSITION.x;
	bPositions[index] = vec4( fPosition.x, fPosition.y, fPosition.z, 1.0 );

	OUT_COLOR0 = vec4( 0.0, 0.0, 0.0, 0.0 );
}
