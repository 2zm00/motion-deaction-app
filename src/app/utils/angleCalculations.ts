interface Landmark {
	x: number;
	y: number;
	z?: number;
	visibility?: number;
}


// 세개의 랜드마크를 사용하여 관절각도를 계산하는 함수
function calculateAngle(p1: Landmark, p2: Landmark, p3: Landmark): number {
	
	const vec1_x = p1.x - p2.x;
	const vec1_y = p1.y - p2.y;

	const vec2_x = p3.x - p2.x;
	const vec2_y = p3.y - p2.y;

	const dotProduct = vec1_x * vec2_x + vec1_y * vec2_y;

	const magnitude1 = Math.sqrt(vec1_x * vec1_x + vec1_y * vec1_y);
	const magnitude2 = Math.sqrt(vec2_x * vec2_x + vec2_y * vec2_y);

	const cosAngle = dotProduct / (magnitude1 * magnitude2);

	const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle)))

	const angleDeg = angleRad * (180 / Math.PI);

	return angleDeg;
}


const PoseLandmarkIds = {
	NOSE: 0,
	LEFT_EYE_INNER: 1,
	LEFT_EYE: 2,
	LEFT_EYE_OUTER: 3,
	RIGHT_EYE_INNER: 4,
	RIGHT_EYE: 5,
	RIGHT_EYE_OUTER: 6,
	LEFT_EAR: 7,
	RIGHT_EAR: 8,
	MOUTH_LEFT: 9,
	MOUTH_RIGHT: 10,
	LEFT_SHOULDER: 11,
	RIGHT_SHOULDER: 12,
	LEFT_ELBOW: 13,
	RIGHT_ELBOW: 14,
	LEFT_WRIST: 15,
	RIGHT_WRIST: 16,
	LEFT_PINKY: 17,
	RIGHT_PINKY: 18,
	LEFT_INDEX: 19,
	RIGHT_INDEX: 20,
	LEFT_THUMB: 21,
	RIGHT_THUMB: 22,
	LEFT_HIP: 23,
	RIGHT_HIP: 24,
	LEFT_KNEE: 25,
	RIGHT_KNEE: 26,
	LEFT_ANKLE: 27,
	RIGHT_ANKLE: 28,
	LEFT_HEEL: 29,
	RIGHT_HEEL: 30,
	LEFT_FOOT_INDEX: 31,
	RIGHT_FOOT_INDEX: 32,
};