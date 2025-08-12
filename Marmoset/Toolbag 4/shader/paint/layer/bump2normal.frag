USE_TEXTURE2D(tNormalMap);
USE_TEXTURE2D(tBumpMap);
USE_TEXTURE2D(tClipMask);

#include "blendfunctions.sh"
#include "layernoise.sh"
#include "layerformat.sh"

uniform vec2 uPixelSize;
uniform float uBumpWeight;

BEGIN_PARAMS
INPUT0( vec2, fBufferCoord )
OUTPUT_COLOR0( vec4 )
END_PARAMS
{
#ifdef CLIP_TEST
	float clip = texture2D( tClipMask, fBufferCoord ).r;
	if( clip < 0.1 )
	{ discard; }
#endif

	vec4 bump = texture2D( tBumpMap, fBufferCoord );
	vec4 norm = texture2D( tNormalMap, fBufferCoord );
	norm = formatInputColor( uInputFormat, norm );
	norm.xyz = (2.0 * norm.rgb) - vec3(1.0,1.0,1.0);

	const float sampleRadius = 1.5; //NOTE: set this to 1.5 for smoother, texel-cracks sampling
	vec2 offset = uPixelSize * sampleRadius;

	
	float samples[8];
	/*	5 6 7
		3 . 4
		0 1 2 */
	samples[0] = texture2D( tBumpMap, fBufferCoord + vec2(-offset.x, -offset.y) ).r;
	samples[1] = texture2D( tBumpMap, fBufferCoord + vec2(	0.0,	-offset.y) ).r;
	samples[2] = texture2D( tBumpMap, fBufferCoord + vec2( offset.x, -offset.y) ).r;

	samples[3] = texture2D( tBumpMap, fBufferCoord + vec2(-offset.x, 0.0) ).r;
	samples[4] = texture2D( tBumpMap, fBufferCoord + vec2( offset.x,	0.0) ).r;	

	samples[5] = texture2D( tBumpMap, fBufferCoord + vec2(-offset.x, offset.y) ).r;
	samples[6] = texture2D( tBumpMap, fBufferCoord + vec2(	0.0,	offset.y) ).r;
	samples[7] = texture2D( tBumpMap, fBufferCoord + vec2( offset.x, offset.y) ).r;

	vec2 avgd = vec2(0.0,0.0);
	
	//cross
	float weight = 1.0/sampleRadius;
	avgd.x += ((samples[3] - bump.r) + (bump.r - samples[4])) * weight;
	avgd.y += ((samples[1] - bump.r) + (bump.r - samples[6])) * weight;
	
	//diagonals
	weight = 1.0 / (sampleRadius * 1.4142);
	float diag = ((samples[0] - bump.r) + (bump.r - samples[7])) * weight;
	avgd.x += diag;
	avgd.y += diag;
	diag = ((samples[5] - bump.r) + (bump.r - samples[2])) * weight;
	avgd.x += diag;
	avgd.y -= diag; //5-to-2 Y slope needs to be flipped
	
	//sum up a delta
	vec3 dn;
	dn.x = avgd.x * 0.25;
	dn.y = avgd.y * 0.25;
	dn.z = uBumpWeight;
	dn = normalize( dn );
	
	//add onto normal map
	dn = normalize( 
		(norm.xyz - vec3(0.0, 0.0, 1.0)) +
		(dn.xyz - vec3(0.0, 0.0, 1.0)) * bump.a +
		vec3(0.0, 0.0, 1.0)
	);
	dn.rgb = (0.5 * dn.xyz) + vec3(0.5,0.5,0.5);

	#ifdef USE_DITHER
		dn = layerDither8bit( dn.rgb, IN_POSITION.xy );
	#endif

	norm.rgb = dn.rgb;
	OUT_COLOR0 = formatOutputColor( uOutputFormat, norm );
}
