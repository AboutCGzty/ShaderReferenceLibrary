uniform vec2 uBufferSizeInv;
USE_TEXTURE2D(tFlow);
USE_TEXTURE2D(tOpacity);
USE_TEXTURE2D(tSelection);
BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec4)
END_PARAMS
{
	vec2 strokeCoords = fCoord;
	vec4 inStroke = texture2D(tFlow, strokeCoords);
	vec4 opbuffer = texture2D(tOpacity, strokeCoords);
	vec4 selection = texture2D(tSelection, strokeCoords);
	float mask = opbuffer.r;		//coverage mask of our stroke, including all previous regenerations
	inStroke.g = opbuffer.a;
	float UVMask = inStroke.g;	//full UV area of the everything
	
	//bleed!
	if(UVMask == 0.0 && selection.r != 0.0)
	{
		vec2 dUV = uBufferSizeInv;
		vec4 right = texture2D(tFlow, strokeCoords + vec2(dUV.x, 0.0));
		right.g = texture2D(tOpacity, strokeCoords + vec2(dUV.x, 0.0)).a;
		vec4 left = texture2D(tFlow, strokeCoords + vec2(-dUV.x, 0.0));
		left.g = texture2D(tOpacity, strokeCoords + vec2(-dUV.x, 0.0)).a;
		vec4 up = texture2D(tFlow, strokeCoords + vec2(0.0, dUV.y));
		up.g = texture2D(tOpacity, strokeCoords + vec2(0.0, dUV.y)).a;
		vec4 down = texture2D(tFlow, strokeCoords + vec2(0.0, -dUV.y));
		down.g = texture2D(tOpacity, strokeCoords + vec2(0.0, -dUV.y)).a;
		inStroke = mix(inStroke, right, float(right.g > inStroke.g));
		inStroke = mix(inStroke, left, float(left.g > inStroke.g));
		inStroke = mix(inStroke, up, float(up.g > inStroke.g));
		inStroke = mix(inStroke, down, float(down.g > inStroke.g));
		mask = max(inStroke.g, mask);	//the cumulative mask also must bleeed
	}

	float flow = inStroke.r;
	float opacity = inStroke.g;

	float alpha = opacity;
	alpha = saturate(flow) * alpha * selection.r;
	OUT_COLOR0 = vec4(alpha, mask, alpha, alpha);
}
