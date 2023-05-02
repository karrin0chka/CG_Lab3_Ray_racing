#version 430

const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;
const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;
const int MAX_STACK_SIZE = 10;
const int MAX_TRACE_DEPTH = 8;
const vec4 Unit = vec4 (1, 1, 1, 1);
out vec4 FragColor;
in vec3 glPosition;

uniform float reflector;
uniform int DEPTH;
uniform vec4 cube_color;
uniform vec3 camera_position;
uniform int rotation;

struct SSphere
{
	vec3 Center;
	float Radius;
	int MaterialIdx;
};

struct STriangle
{
	vec3 v1;
	vec3 v2;
	vec3 v3;
	int MaterialIdx;
};

struct SCamera
{
	vec3 Position;
	vec3 View;
	vec3 Up;
	vec3 Side;
	vec2 Scale;
};

struct SRay
{
	vec3 Origin;
	vec3 Direction;
};

struct SIntersection
{
	float Time;
	vec3 Point;
	vec3 Normal;
	vec4 Color;
	vec4 LightCoeffs;
	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct SLight
{
	vec3 Position;
};

struct SMaterial
{
	vec4 Color;
	vec4 LightCoeffs;
	float ReflectionCoef;
	float RefractionCoef;
	int MaterialType;
};

struct STracingRay
{
	SRay ray;
	float contribution;
	int depth;
};

STriangle triangles[28];
SSphere spheres[2];
SLight uLight;
SMaterial materials[8];
SCamera uCamera;

SRay GenerateRay (SCamera uCamera)
{
	vec2 coords = glPosition.xy * uCamera.Scale;
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
	return SRay ( uCamera.Position, normalize(direction) );
}

SCamera initializeDefaultCamera()
{
	SCamera camera;
	camera.Position = camera_position;
	camera.View = vec3(0.0, 0.0, 1.0 * rotation);
	camera.Up = vec3(0.0, 1.0, 0.0);
	camera.Side = vec3(1.0, 0.0, 0.0);
	camera.Scale = vec2(3.0);
	return camera;
}

void initializeDefaultScene(out STriangle triangles[28], out SSphere spheres[2])
{
	/** WALLS **/

	triangles[0].v1 = vec3(-5.0,-5.0,-8.0);
	triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[0].v3 = vec3(-5.0, 5.0,-8.0);

	triangles[1].v1 = vec3(-5.0,-5.0,-8.0);
	triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[1].v3 = vec3(-5.0, 5.0, 5.0);

	triangles[2].v1 = vec3(-5.0, 5.0, 5.0);
	triangles[2].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[2].v3 = vec3(5.0, -5.0, 5.0);

	triangles[3].v1 = vec3( 5.0, -5.0, 5.0);
	triangles[3].v2 = vec3(5.0, 5.0, 5.0);
	triangles[3].v3 = vec3(-5.0, 5.0, 5.0);

	triangles[4].v1 = vec3(5.0, -5.0, 5.0);
	triangles[4].v2 = vec3(5.0, 5.0, 5.0);
	triangles[4].v3 = vec3(5.0, 5.0, -8.0);

    triangles[5].v1 = vec3(5.0, 5.0, -8.0);
	triangles[5].v2 = vec3(5.0, -5.0, -8.0);
	triangles[5].v3 = vec3(5.0, -5.0, 5.0);
	
	triangles[6].v1 = vec3(-5.0, 5.0, 5.0);
	triangles[6].v2 = vec3(-5.0, 5.0, -8.0);
	triangles[6].v3 = vec3(5.0, 5.0, -8.0);

    triangles[7].v1 = vec3(5.0, 5.0, -8.0);
	triangles[7].v2 = vec3(5.0, 5.0, 5.0);
	triangles[7].v3 = vec3(-5.0, 5.0, 5.0);

    triangles[8].v1 = vec3(-5.0, -5.0, 5.0);
	triangles[8].v2 = vec3(-5.0, -5.0, -8.0);
	triangles[8].v3 = vec3(5.0, -5.0, -8.0);
	
	triangles[9].v1 = vec3(5.0,-5.0,-8.0);
	triangles[9].v2 = vec3(5.0, -5.0, 5.0);
	triangles[9].v3 = vec3(-5.0, -5.0, 5.0);
	
	triangles[10].v1 = vec3(-5.0, -5.0, -8.0);
	triangles[10].v2 = vec3(5.0, -5.0, -8.0);
	triangles[10].v3 = vec3(5.0, 5.0, -8.0);
	
	triangles[11].v1 = vec3(5.0, 5.0,-8.0);
	triangles[11].v2 = vec3(-5.0, 5.0, -8.0);
	triangles[11].v3 = vec3(-5.0, -5.0, -8.0);

	/** SPHERES **/

	spheres[0].Center = vec3(1.0, -1.0, 2.0);
	spheres[0].Radius = 0.6;

	spheres[1].Center = vec3(-1.0, -1.0, 2.0);
	spheres[1].Radius = 0.6;

	/** CUBE **/

	triangles[12].v1 = vec3(2.0, 2.0, 2.0);
	triangles[12].v2 = vec3(2.0, 2.0, 4.0);
	triangles[12].v3 = vec3(2.0, 0.0, 2.0);

	triangles[13].v1 = vec3(2.0, 2.0, 4.0);
	triangles[13].v2 = vec3(2.0, 0.0, 4.0);
	triangles[13].v3 = vec3(2.0, 0.0, 2.0);

	triangles[14].v1 = vec3(2.0, 2.0, 4.0);
	triangles[14].v2 = vec3(4.0, 0.0, 4.0);
	triangles[14].v3 = vec3(2.0, 0.0, 4.0);

	triangles[15].v1 = vec3(4.0, 2.0, 4.0);
	triangles[15].v2 = vec3(2.0, 2.0, 4.0);
	triangles[15].v3 = vec3(4.0, 0.0, 4.0);

	triangles[16].v1 = vec3(4.0, 2.0, 2.0);
	triangles[16].v2 = vec3(4.0, 0.0, 4.0);
	triangles[16].v3 = vec3(4.0, 2.0, 4.0);

	triangles[17].v1 = vec3(4.0, 0.0, 2.0); 
	triangles[17].v2 = vec3(4.0, 0.0, 4.0); 
	triangles[17].v3 = vec3(4.0, 2.0, 2.0); 

	triangles[18].v1 = vec3(4.0, 0.0, 4.0);
	triangles[18].v2 = vec3(2.0, 0.0, 2.0);
	triangles[18].v3 = vec3(2.0, 0.0, 4.0);

	triangles[19].v1 = vec3(2.0, 0.0, 2.0);
	triangles[19].v2 = vec3(4.0, 0.0, 4.0);
	triangles[19].v3 = vec3(4.0, 0.0, 2.0);

	triangles[20].v1 = vec3(4.0, 2.0, 4.0);
	triangles[20].v2 = vec3(2.0, 2.0, 4.0);
	triangles[20].v3 = vec3(2.0, 2.0, 2.0);

	triangles[21].v1 = vec3(4.0, 2.0, 2.0);
	triangles[21].v2 = vec3(4.0, 2.0, 4.0);
	triangles[21].v3 = vec3(2.0, 2.0, 2.0);

	triangles[22].v1 = vec3(2.0, 0.0, 2.0);
	triangles[22].v2 = vec3(4.0, 0.0, 2.0);
	triangles[22].v3 = vec3(2.0, 2.0, 2.0);

	triangles[23].v1 = vec3(4.0, 2.0, 2.0);
	triangles[23].v2 = vec3(2.0, 2.0, 2.0);
	triangles[23].v3 = vec3(4.0, 0.0, 2.0);

	/** TETRAHEDRON **/
	
	triangles[24].v1 = vec3(-0.3, 1.0, 0.5);
	triangles[24].v2 = vec3(-1.0, 1.0, 1.5);
	triangles[24].v3 = vec3(-0.5, 1.0, 1.5);
	
	triangles[25].v1 = vec3(-0.3, 1.0, 0.5);
	triangles[25].v2 = vec3(-1.0, 1.0, 1.5);
	triangles[25].v3 = vec3(-1.0, 0.2, 2.0);
	
	triangles[26].v1 = vec3(-0.3, 1.0, 0.5);
	triangles[26].v2 = vec3(-1.0, 0.2, 2.0);
	triangles[26].v3 = vec3(-0.5, 1.0, 1.5);
	
	triangles[27].v1 = vec3(-1.0, 1.0, 1.5);
	triangles[27].v2 = vec3(-0.5, 1.0, 1.5);
	triangles[27].v3 = vec3(-1.0, 0.2, 2.0);
}

bool IntersectSphere (SSphere sphere, SRay ray, float start, float final, out float time)
{
	ray.Origin -= sphere.Center;
	float A = dot ( ray.Direction, ray.Direction );
	float B = dot ( ray.Direction, ray.Origin );
	float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;
	float D = B * B - A * C;
	if ( D > 0.0 )
	{
		D = sqrt ( D );
		//time = min ( max ( 0.0, ( -B - D ) / A ), ( -B + D ) / A );
		float t1 = ( -B - D ) / A;
		float t2 = ( -B + D ) / A;
		if(t1 < 0 && t2 < 0)
			return false;

		if(min(t1, t2) < 0)
		{
			time = max(t1,t2);
			return true;
		}
		time = min(t1, t2);
		return true;
	}
	return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time)
{
	time = -1;
	vec3 A = v2 - v1;
	vec3 B = v3 - v1;
	vec3 N = cross(A, B);
	float NdotRayDirection = dot(N, ray.Direction);
	if (abs(NdotRayDirection) < 0.001) return false;
	float d = dot(N, v1);
	float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
	if (t < 0) return false;
	vec3 P = ray.Origin + t * ray.Direction;
	vec3 C;
	vec3 edge1 = v2 - v1;
	vec3 VP1 = P - v1;
	C = cross(edge1, VP1);
	if (dot(N, C) < 0) return false;
	vec3 edge2 = v3 - v2;
	vec3 VP2 = P - v2;
	C = cross(edge2, VP2);
	if (dot(N, C) < 0) return false;
	vec3 edge3 = v1 - v3;
	vec3 VP3 = P - v3;
	C = cross(edge3, VP3);
	if (dot(N, C) < 0) return false;
	time = t;
	return true;
}

bool Raytrace (SRay ray, float start, float final, inout SIntersection intersect)
{
	bool result = false;
	float test = start;
	intersect.Time = final;
	for(int i = 0; i < 2; i++)
	{
		SSphere sphere = spheres[i];
		if(IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
			SMaterial mat = materials[6];
			intersect.Color = mat.Color;
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = reflector;
			intersect.RefractionCoef = mat.RefractionCoef;
			intersect.MaterialType = mat.MaterialType;
			result = true;
		}
	}

	for(int i = 0; i < 12; i++)
	{
		STriangle triangle = triangles[i];
		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = 
			normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			SMaterial mat = materials[i / 2];
			intersect.Color = mat.Color;
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = mat.ReflectionCoef;
			intersect.RefractionCoef = mat.RefractionCoef;
			intersect.MaterialType = mat.MaterialType;
			result = true;
		}
	}

	for(int i = 12; i < 28; i++)
	{
		STriangle triangle = triangles[i];
		if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time)
		{
			intersect.Time = test;
			intersect.Point = ray.Origin + ray.Direction * test;
			intersect.Normal = 
			normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
			SMaterial mat = materials[7];
			intersect.Color = mat.Color;
			intersect.LightCoeffs = mat.LightCoeffs;
			intersect.ReflectionCoef = mat.ReflectionCoef;
			intersect.RefractionCoef = mat.RefractionCoef;
			intersect.MaterialType = mat.MaterialType;
			result = true;
		}
	}
	return result;
}

void initializeDefaultLightMaterials(out SLight light, out SMaterial materials[8])
{
	/** LIGHT **/
	light.Position = vec3(0.0, 2.0, -4.0f);
	/** MATERIALS **/
	vec4 lightCoefs = vec4(0.4, 0.9, 0.0, 512.0);

	for(int i = 0; i < 8; i++)
	{
		materials[i].LightCoeffs = vec4(lightCoefs);
		materials[i].ReflectionCoef = cube_color.w;
		materials[i].RefractionCoef = 1.0;
		materials[i].MaterialType = DIFFUSE_REFLECTION;
	}

	materials[0].Color = vec4(0.35, 0.20, 0.32, 1.0);
	materials[1].Color = vec4(0.51, 0.33, 0.80, 1.0);
	materials[2].Color = vec4(0.34, 0.32, 0.99, 1.0);
	materials[3].Color = vec4(0.70, 0.85, 0.75, 1.0);
	materials[4].Color = vec4(0.60, 0.60, 0.08, 1.0);
	materials[5].Color = vec4(0.40, 0.20, 0.02, 1.0);
	materials[6].Color = vec4(0.20, 0.08, 1.0, 1.0);
	materials[7].Color = cube_color;
	
	materials[6].MaterialType = MIRROR_REFLECTION;
	materials[6].ReflectionCoef = reflector;
	materials[7].MaterialType = REFRACTION;
}

vec4 Phong (SIntersection intersect, SLight currLight, float shadowing)
{
	vec3 light = normalize (currLight.Position - intersect.Point);
	float diffuse = max(dot(light, intersect.Normal), 0.0);
	vec3 view = normalize(uCamera.Position - intersect.Point);
	vec3 reflected = reflect( -view, intersect.Normal );
	float specular = pow(max(dot(reflected, light), 0.0), intersect.LightCoeffs.w);
	return intersect.LightCoeffs.x * intersect.Color + intersect.LightCoeffs.y * diffuse * intersect.Color * shadowing + intersect.LightCoeffs.z * specular * Unit;
}

float Shadow(SLight currLight, SIntersection intersect)
{
	float shadowing = 1.0;
	vec3 direction = normalize(currLight.Position - intersect.Point);
	float distanceLight = distance(currLight.Position, intersect.Point);
	SRay shadowRay = SRay(intersect.Point + direction * 0.001, direction);
	SIntersection shadowIntersect;
	shadowIntersect.Time = 1000000.0;
	if(Raytrace(shadowRay, 0, distanceLight, shadowIntersect))
	{
		shadowing = 0.0;
	}
	return shadowing;
}

STracingRay stack[MAX_STACK_SIZE];
int stackSize = 0;
bool pushRay(STracingRay secondaryRay)
{
	if(stackSize < MAX_STACK_SIZE - 1 && secondaryRay.depth < MAX_TRACE_DEPTH)
	{
		stack[stackSize] = secondaryRay;
		stackSize++;
		return true;
	}
	return false;
}

bool isEmpty()
{
	if(stackSize < 0)
		return true;
	return false;
}

STracingRay popRay()
{
	stackSize--;
	return stack[stackSize];
}

void main (void)
{
	float start = 0;
	float final = 1000000.0;

	uCamera = initializeDefaultCamera();

	SRay ray = GenerateRay(uCamera);
	SIntersection intersect;
	intersect.Time = 1000000.0;
	vec4 resultColor = vec4(0, 0, 0, 1);

	initializeDefaultLightMaterials(uLight, materials);
	initializeDefaultScene(triangles, spheres);

	STracingRay trRay = STracingRay(ray, 1, DEPTH);
	pushRay(trRay);
	while(!isEmpty())
	{
		STracingRay trRay = popRay();
		ray = trRay.ray;
		SIntersection intersect;
		intersect.Time = 1000000.0;
		start = 0;
		final = 1000000.0;
		if (Raytrace(ray, start, final, intersect))
		{
			switch(intersect.MaterialType)
			{
				case DIFFUSE_REFLECTION:
				{
					float shadow = Shadow(uLight, intersect);
					resultColor += trRay.contribution * Phong (intersect, uLight, shadow);
					break;
				}
				case MIRROR_REFLECTION:
				{
					if(intersect.ReflectionCoef < 1)
					{
						float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
						float shadowing = Shadow(uLight, intersect);
						resultColor += contribution * Phong(intersect, uLight, shadowing);
					}
					vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
					float contribution = trRay.contribution * intersect.ReflectionCoef;
					STracingRay reflectRay = STracingRay(SRay(intersect.Point + reflectDirection * 0.001, reflectDirection), contribution, trRay.depth + 1);
					pushRay(reflectRay);
					break;
				}
				case REFRACTION:
                {
                    float shadowing = Shadow(uLight, intersect);
                    bool fromOutside = dot(intersect.Normal, ray.Direction) < 0.0;
                    vec3 refractDirection;
                    refractDirection = fromOutside ? refract(ray.Direction, intersect.Normal, 1/1.4) : -refract(ray.Direction, intersect.Normal, 1/1.4);

                    float contribution = trRay.contribution * intersect.ReflectionCoef;
                    STracingRay refractRay = STracingRay(SRay(intersect.Point + refractDirection * 0.001, refractDirection),
                    contribution, trRay.depth + 1);
                    resultColor += contribution * Phong(intersect, uLight, shadowing);
                    pushRay(refractRay);

                    break;
                }
			}
		}
	}
	FragColor = resultColor;
}