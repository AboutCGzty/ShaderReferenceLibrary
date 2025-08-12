uniform ivec2 uTexSize;
uniform int uChunkSizeX;
uniform int uChunkSizeY;
uniform int uComponents;

USE_TEXTURE2D(tTex);
USE_SAMPLER(uSamp);

uint hashUInt(uint v, uint prev)
{
	uint 		Hash32Prime = 33;
	return prev * Hash32Prime + v;
}

uint hashVec4(vec4 v, uint prev)
{
	uint h = hashUInt(uint(v.r * 255.0), prev);
	h = hashUInt(uint(v.g * 255.0), h);
	h = hashUInt(uint(v.b * 255.0), h);
	h = hashUInt(uint(v.a * 255.0), h);
	return h;

}

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec2)
END_PARAMS
{
	uint		Hash32Base = 5381;
	//establish bounds
	int xStart = uChunkSizeX * int(floor(IN_POSITION.x));
	int yStart = uChunkSizeY * int(floor(IN_POSITION.y));
	int xEnd = min(xStart + uChunkSizeX, uTexSize.x);
	int yEnd = min(yStart + uChunkSizeY, uTexSize.y);
	float val = 0.0;
	uint hash = Hash32Base;
	float u1 = float(uComponents>1);
	float u2 = float(uComponents>2);
	float u3 = float(uComponents>3);
	for(int y = yStart; y < yEnd; y++)
	{
		float v = float(y)/float(uTexSize.y);
		for(int x = xStart; x < xEnd; x++)
		{
			float u = float(x)/float(uTexSize.x);
			vec4 t = textureWithSamplerLod(tTex, uSamp, vec2(u, v), 0.0);
			val = max(val, t.r);
			val = max(val, t.g * u1);
			val = max(val, t.b * u2);
			val = max(val, t.a * u3);
			hash = hashVec4(t, hash);
		}
	}
	//spread the hash out onto our two channels
	float red = mod(float(hash), 32768.0) / 32768.0;
	float green = floor(mod(float(hash/32768), 32768.0)) / 32768.0;
	OUT_COLOR0.rg = vec2(red, green) * ceil(min(val, 1.0));

}
