#ifndef MSET_VERTEX_STATE_H
#define MSET_VERTEX_STATE_H

struct	VertexState
{
	vec4	rasterPosition;
	vec3	position;
	vec3	tangent;
	vec3	bitangent;
	vec3	normal;
	vec4	color;
	vec4	texCoord;
	vec4	texCoordScaleBias;
	int		instanceID;
	uint	vertexID;
};

#endif
