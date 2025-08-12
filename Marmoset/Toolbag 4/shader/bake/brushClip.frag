#ifndef MSET_BRUSH_CLIP_FRAG
#define MSET_BRUSH_CLIP_FRAG

USE_TEXTURE2D(uBrushMask);

bool	brushClip( vec2 texcoord )
{
	return texture2DLod( uBrushMask, texcoord, 0.0 ).x > 0.0;
}

#endif