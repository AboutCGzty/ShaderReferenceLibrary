#include "../state.vert"

//Copied from Layer.sh
uniform mat4	uTextureMatrix;
uniform vec4 uViewportScaleBias;

#ifdef EFFECT_POSITIONAL
	void	PaintPremerge( inout VertexState s )
	{
		// Positional shaders are unaffected by uv scale/bias because uv projection happens in the fragment shader
		s.texCoordScaleBias = vec4(1.0,1.0,0.0,0.0);
	}
	#define Premerge PaintPremerge
	
	void	PaintMerge( inout VertexState s )
	{
		// Positional shaders need Merge to set an explicit raster position
		s.rasterPosition.xy = 2.0 * s.texCoord.xy - vec2(1.0,1.0);

		vec4 scaleBias = uViewportScaleBias;
		#ifdef RENDERTARGET_Y_DOWN
			//flip raster position so that all rendered results are upside down
			s.rasterPosition.y = -s.rasterPosition.y; 
			scaleBias.w = -scaleBias.w;
		#endif
		s.rasterPosition.xy = (s.rasterPosition.xy * scaleBias.xy) + scaleBias.zw;
		s.rasterPosition.z = 0.5;
		s.texCoord.zw = s.texCoord.xy;
	}
	#define Merge PaintMerge	

#else
	#define VERT_NOATTRIBS
	void	PaintPremerge( inout VertexState s )
	{
		//flip raster position so that all rendered results are upside down
		vec4 scaleBias = uViewportScaleBias;
		#ifdef RENDERTARGET_Y_DOWN
			s.position.xy = vec2(
				s.vertexID == 2 ? 3.0 : -1.0,
				s.vertexID == 1 ? -3.0 : 1.0 );									
				scaleBias.w = -scaleBias.w;
		#else
			s.position.xy = vec2(
				s.vertexID == 1 ? 3.0 : -1.0,
				s.vertexID == 2 ? 3.0 : -1.0 );
		#endif	
		s.texCoord.xy = abs(s.position.xy) - vec2(1.0, 1.0);
		s.texCoord.zw = s.texCoord.xy;
		
		s.position.xy = (s.position.xy * scaleBias.xy) + scaleBias.zw;
		s.position.z = 0.5;
	}
	#define Premerge PaintPremerge
#endif
