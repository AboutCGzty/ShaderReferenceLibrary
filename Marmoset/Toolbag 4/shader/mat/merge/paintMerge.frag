#include "data/shader/paint/layer/materialsurface.frag"
#include "data/shader/mat/state.frag"
#include "data/shader/paint/layer/layer.sh"
#include "data/shader/paint/layer/layerprojector.sh"

#ifdef PAINT_COMPOSITE
	#include "data/shader/paint/layer/materialcomposite.frag"
#endif

uniform vec4		uMaterialScaleBias;	// UV scale and bias from the material system, to be used if mat.vert texture coordinates are overwritten
uniform float		uUseMetalWorkflow;	// 1.0 if using metalness workflow for albedo

#ifdef EFFECT_POSITIONAL	
	uniform mat4	uModelView;
	uniform mat4	uModelViewIT;
	uniform vec4	uScaleBias;
#endif

///

void	_initFragmentState( inout FragmentState s )
{
	//state defaults
	s.displacement = 0.5;
	s.albedo = vec4(1.0,1.0,1.0,1.0);
	s.baseColor = s.albedo.rgb;
	s.normal = vec3(0.5,0.5,1.0);
	s.gloss = 0.7;
	s.reflectivity = vec3(0.04, 0.04, 0.04);
	s.sheen = vec3(0.0,0.0,0.0);
	s.sheenRoughness = 0.5;
	s.fuzz = vec3(0.0,0.0,0.0);
	s.transmissivity = vec3(1.0,1.0,1.0);
	s.metalness = 0.0;
	s.occlusion = 1.0;
	s.cavity = 1.0;
	s.scatterColor = vec3(0.0,0.0,0.0);
	s.emissiveLight = vec3(0.0,0.0,0.0);
	s.anisoTangent = vec3(0.0,1.0,0.0);
}

void	PaintPremerge( inout FragmentState s )
{
	#ifdef PAINT_COMPOSITE
		vec2 texCoord = s.screenTexCoord.xy;	//the tex coord at which we should sample the material
		paintStrokeCull(texCoord);	//grab brush-space UVs if needed
		texCoord = texCoord * uMaterialScaleBias.xy + uMaterialScaleBias.zw;
		s.vertexTexCoord.xy = mix(s.vertexTexCoord.xy, texCoord, float(uReadUVs)); 
	#endif
	
	s.vertexTexCoord.xy = 
		col0(uTextureMatrix).xy * s.vertexTexCoord.x + 
		col1(uTextureMatrix).xy * s.vertexTexCoord.y + 
		col3(uTextureMatrix).xy;

	_initFragmentState( s );
}
#define Premerge PaintPremerge

void	PaintMerge( inout FragmentState s )
{
	#ifndef LAYER_OUTPUT
		#define	LAYER_OUTPUT 0
	#endif

	vec4 o = vec4(1.0,1.0,1.0,1.0);

	#if LAYER_OUTPUT == CHANNEL_NORMAL		
		//un-texture-matrix
		o.rgb = normalize( mulVec( uTextureMatrixInv, s.normal ) );
		o.rgb = 0.5 * o.rgb + vec3(0.5,0.5,0.5);

	#elif LAYER_OUTPUT == CHANNEL_ALBEDO		
		o.rgb = mix( s.albedo.rgb * (1.0-s.metalness), s.baseColor, uUseMetalWorkflow );
	
	#elif LAYER_OUTPUT == CHANNEL_SPECULAR
		o.rgb = s.reflectivity;
			
	#elif LAYER_OUTPUT == CHANNEL_GLOSS
		o.r = o.g = o.b = s.gloss;

	#elif LAYER_OUTPUT == CHANNEL_ROUGHNESS
		o.r = o.g = o.b = 1.0 - s.gloss;

	#elif LAYER_OUTPUT == CHANNEL_METALNESS
		o.r = o.g = o.b = s.metalness;

	#elif LAYER_OUTPUT == CHANNEL_OCCLUSION
		o.r = o.g = o.b = s.occlusion;

	#elif LAYER_OUTPUT == CHANNEL_CAVITY
		o.r = o.g = o.b = s.cavity;

	#elif LAYER_OUTPUT == CHANNEL_OPACITY
		o.r = o.g = o.b = s.albedo.a;

	#elif LAYER_OUTPUT == CHANNEL_DISPLACEMENT
		o.r = o.g = o.b = s.displacement;

	#elif LAYER_OUTPUT == CHANNEL_BUMP
		o.r = o.g = o.b = .5;

	#elif LAYER_OUTPUT == CHANNEL_EMISSIVE
		o.rgb = s.emissiveLight;
		
	#elif LAYER_OUTPUT == CHANNEL_SCATTER
		o.rgb = s.scatterColor;

	#elif LAYER_OUTPUT == CHANNEL_TRANSMISSION_MASK
		o.rgb = s.transmissivity;

	#elif LAYER_OUTPUT == CHANNEL_ANISO_DIR
		o.rgb = s.anisoTangent * 0.5 + vec3(0.5,0.5,0.5);

	#elif LAYER_OUTPUT == CHANNEL_FUZZ
		o.rgb = s.fuzz;

	#elif LAYER_OUTPUT == CHANNEL_SHEEN
		o.rgb = s.sheen;

	#elif LAYER_OUTPUT == CHANNEL_SHEEN_ROUGHNESS
		o.rgb = s.sheenRoughness;
	#endif
	
	// material fill does not write alpha for various reasons including bc7 compression artifacts. --Andres
	o.a = 1.0;

	#ifdef EFFECT_POSITIONAL		
		s.output0 = o; //NOTE: composite happens after projection with positional		
	#else	
		o = materialSurfaceAdjust( o );
		vec2 surfaceCoord = s.screenTexCoord.xy;
		#ifdef PAINT_COMPOSITE
			vec4 stroke = paintStrokeCull(surfaceCoord);
			vec2 dUVx = dFdx(surfaceCoord.xy);
			vec2 dUVy = dFdy(surfaceCoord.xy);
		#endif
		LayerState lstate = getLayerState( s.screenTexCoord.xy );
		lstate.result = o;
		s.output0 = compositeLayerStateNoDither( lstate );		
		#ifdef PAINT_COMPOSITE
			paintStrokeComposite(stroke, s.screenTexCoord.xy, dUVx, dUVy, s.output0);
		#endif
		
	#endif
}
#define Merge	PaintMerge

#ifdef EFFECT_POSITIONAL
	#if defined(EFFECT_TRIPLANAR)
		vec3	PaintPremergeTriplanar( inout FragmentState sx, inout FragmentState sy, inout FragmentState sz )
		{	
			_initFragmentState( sx );
			_initFragmentState( sy );
			_initFragmentState( sz );

			#ifdef PAINT_COMPOSITE
				paintStrokeCull(sx.vertexTexCoord);	//early out
			#endif

			// Get PTBN vectors in projector-space
			vec3 P, T, B, N;		
			P = mulPoint( uModelView, sx.vertexPosition ).xyz;
			T = sx.vertexTangent;
			B = sx.vertexBitangent;
			N = sx.vertexNormal;

			#if LAYER_OUTPUT == CHANNEL_NORMAL
				T = normalize( mulVec( uModelViewIT, T ) );
				B = normalize( mulVec( uModelViewIT, B ) );
			#endif			
			N = normalize( mulVec( uModelViewIT, N ) );	
			N = -N;
			//@@@ Mystery: For some reason vertex normal z needs flipping before passing to normalMap.frag AND before determining triplanar facing.
			
			#ifdef INPUT_NORMAL
				vec3 inputNormal = sampleInputNormal( sx.vertexTexCoord );
				TriplanarSampler p = getTriplanarSampler( P, T, B, N, inputNormal );
			#else
				TriplanarSampler p = getTriplanarSampler( P, T, B, N );
			#endif

			//Scaled by material system UV tile/offset parameter because we recomputed what came to us from mat.vert
			sx.vertexTexCoord = (p.uvX * uMaterialScaleBias.xy) + uMaterialScaleBias.zw;
			sy.vertexTexCoord = (p.uvY * uMaterialScaleBias.xy) + uMaterialScaleBias.zw;
			sz.vertexTexCoord = (p.uvZ * uMaterialScaleBias.xy) + uMaterialScaleBias.zw;

			#if LAYER_OUTPUT == CHANNEL_NORMAL
				// generate triplanar tangent spaces				
				mat4 meshTBN = _identity();
				col0(meshTBN).xyz = T;
				col1(meshTBN).xyz = B;
				col2(meshTBN).xyz = N;
				
				mat4 surfTBN = _identity();
				projectPremultTangents( surfTBN, meshTBN, p.triplaneX );
				sx.vertexTangent =	col0(surfTBN).xyz;
				sx.vertexBitangent= col1(surfTBN).xyz;
				sx.vertexNormal =	col2(surfTBN).xyz;

				projectPremultTangents( surfTBN, meshTBN, p.triplaneY );
				sy.vertexTangent =	col0(surfTBN).xyz;
				sy.vertexBitangent= col1(surfTBN).xyz;
				sy.vertexNormal =	col2(surfTBN).xyz;

				projectPremultTangents( surfTBN, meshTBN, p.triplaneZ );
				sz.vertexTangent =	col0(surfTBN).xyz;
				sz.vertexBitangent= col1(surfTBN).xyz;
				sz.vertexNormal =	col2(surfTBN).xyz;
			#endif
		
			return p.fade * p.facing.xyz;

			// vvv Sampling vvv //
		}
		#define PremergeTriplanar PaintPremergeTriplanar

		void	PaintMergeTriplanar( inout FragmentState result, in FragmentState sx, in FragmentState sy, in FragmentState sz, vec3 weights )
		{
			// ^^^ Sampling ^^^ //

			vec3 facing = sign(weights);
			weights = abs(weights);

			LayerState lstate = getLayerState( result.vertexTexCoord.xy );
				
			#if LAYER_OUTPUT == CHANNEL_NORMAL			
				vec3 Nx = sx.normal;
				vec3 Ny = sy.normal;
				vec3 Nz = sz.normal;
				vec3 N = mix3( Nx, Ny, Nz, weights.xyz );
				N = mulVec( uTextureMatrixInv, N );	
								
				N = normalize(N) * 0.5 + vec3(0.5,0.5,0.5);
				lstate.result.rgb = N;
				lstate.result.a = 1.0;
			#else
				// pull channel results out of the right place in FragState
				PaintMerge( sx );
				PaintMerge( sy );
				PaintMerge( sz );

				// mix and composite
				lstate.result = mix3( sx.output0, sy.output0, sz.output0, weights.xyz );
			#endif
		
			lstate.result = materialSurfaceAdjust( lstate.result );
			result.output0 = compositeLayerStateNoDither( lstate );
			#ifdef PAINT_COMPOSITE
				vec2 st = result.vertexTexCoord.xy;
				vec4 stroke = paintStrokeCull(st);
				vec2 dUVx = dFdx(st.xy);	//used to be screenTexCoord --Andres
				vec2 dUVy = dFdy(st.xy);
				paintStrokeComposite(stroke, result.vertexTexCoord.xy, dUVx, dUVy, result.output0);
			#endif
		}
		#define MergeTriplanar PaintMergeTriplanar

	#elif defined(EFFECT_PLANAR)
		void	PaintPremergePlanar( inout FragmentState state )
		{	
			#ifdef PAINT_COMPOSITE
				paintStrokeCull(state.vertexTexCoord);	//early out
			#endif

			vec3 P, T, B, N;		
			P = mulPoint( uModelView, state.vertexPosition ).xyz;			
			T = state.vertexTangent;
			B = state.vertexBitangent;
			N = state.vertexNormal;
			
			#if LAYER_OUTPUT == CHANNEL_NORMAL
				N = normalize( mulVec( uModelViewIT, N ) );	
				N = -N;											//@@@ Mystery				
				float flip = sign(N.z);

				T = normalize( mulVec( uModelViewIT, T ) );
				B = normalize( mulVec( uModelViewIT, B ) );
			
				#ifdef INPUT_NORMAL
					vec3 inputNormal = sampleInputNormal( state.vertexTexCoord );
					PlanarSampler samp = getPlanarSampler( P, T, B, N, inputNormal );
				#else
					PlanarSampler samp = getPlanarSampler( P, T, B, N );
				#endif
			
				samp.plane.V *= flip;
			
				mat4 meshTBN = _identity();
				col0( meshTBN ).xyz = T;
				col1( meshTBN ).xyz = B;
				col2( meshTBN ).xyz = N;
				
				mat4 surfTBN = _identity();
				projectPremultTangents( surfTBN, meshTBN, samp.plane );

				//meshTBN
				state.vertexTangent =		col0(surfTBN).xyz;
				state.vertexBitangent =		col1(surfTBN).xyz;
				state.vertexNormal =		col2(surfTBN).xyz;
				state.vertexTexCoord.xy =	samp.uv;

			#else
				PlanarSampler samp = getPlanarSampler( P, T, B, N );
				state.vertexTexCoord.xy =	samp.uv;
			#endif
			
			// vvv Sampling vvv //
		}
		#define PremergePlanar PaintPremergePlanar

		void	PaintMergePlanar( inout FragmentState result )
		{
			// ^^^ Sampling ^^^ //

			LayerState lstate = getLayerState( result.vertexTexCoord.xy );

			#if LAYER_OUTPUT == CHANNEL_NORMAL
				vec3 tap = mulVec( uTextureMatrixInv, result.normal );				
				tap = normalize(tap) * 0.5 + vec3(0.5,0.5,0.5);				
				lstate.result.rgb = tap;
				lstate.result.a = 1.0;
			#else
				// pull channel results out of the right place in FragState
				PaintMerge( result );
				lstate.result = result.output0;
			#endif
		
			lstate.result = materialSurfaceAdjust( lstate.result );
			result.output0 = compositeLayerStateNoDither( lstate );
			
			#ifdef PAINT_COMPOSITE
				vec2 st = result.vertexTexCoord.xy;
				vec4 stroke = paintStrokeCull(st);
				vec2 dUVx = dFdx(st.xy);	//used to be screenTexCoord --Andres
				vec2 dUVy = dFdy(st.xy);
				paintStrokeComposite(stroke, result.vertexTexCoord.xy, dUVx, dUVy, result.output0);
			#endif
		}
		#define MergePlanar PaintMergePlanar
	#endif
#endif
