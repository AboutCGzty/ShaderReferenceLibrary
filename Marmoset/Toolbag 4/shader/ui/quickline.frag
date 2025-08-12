USE_TEXTURE2D(tTex);
uniform float uPremultAlpha;

BEGIN_PARAMS
INPUT0(vec4,fColor)
INPUT1(vec2, fP1)
INPUT2(vec2, fP2)
INPUT3(float, fWidth)
INPUT4(vec2, fTexCoord)
OUTPUT_COLOR0(vec4)
END_PARAMS
{
	
	vec2 pos = IN_POSITION.xy;
	vec2 toP1 = fP1-pos;
	vec2 P1P2 = fP2-fP1;
	vec2 dir = normalize(P1P2);
	float perpDist = abs(dot(toP1, vec2(dir.y, -dir.x)));
	
	//adjust the Y-coord of the tex to fit our exact pixel width
	float wt = perpDist / fWidth;
	float texY = fTexCoord.y - 0.5;
	texY = sign(texY) * wt + 0.5;
	
	float inLine = 1.0-smoothstep(fWidth * 0.5-0.5, fWidth * 0.5+0.5, perpDist);
	OUT_COLOR0 = fColor;
	vec4 tex = texture2D(tTex, vec2(fTexCoord.x, texY));
	OUT_COLOR0 *= tex * inLine;
	
	OUT_COLOR0.rgb *= mix(tex.a, 1.0, uPremultAlpha);

}

