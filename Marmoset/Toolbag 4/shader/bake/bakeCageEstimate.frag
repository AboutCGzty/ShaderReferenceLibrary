#include "hit.frag"

uniform vec2	uOffsetRange;

void	CageEstimate( inout BakeHit h )
{
	float offset = 0.5 * h.rayLength;
	offset = (offset - uOffsetRange.x) / (uOffsetRange.y - uOffsetRange.x);

	h.output0.x =
	h.output0.y =
	h.output0.z = offset;
}

#define Intersection CageEstimate
