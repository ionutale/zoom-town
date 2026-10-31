export const LAPS = 3;
export const BALLOONS_PER_LAP = 5;
export const TOTAL_BALLOONS = BALLOONS_PER_LAP * LAPS;

export function starsForBalloons(balloons: number): number {
	if (balloons >= TOTAL_BALLOONS) return 3;
	if (balloons >= TOTAL_BALLOONS / 2) return 2;
	return 1;
}
