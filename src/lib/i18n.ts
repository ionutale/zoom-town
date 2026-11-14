import type { Lang } from './save';

/**
 * Every user-facing string and accessible name in one place. Copy that used to
 * live inline in six components now lives here, so Italian and English cannot
 * drift apart and `<html lang>` can follow the same setting.
 */
export interface Messages {
	// Shared chrome
	back: string;
	close: string;
	closeSettings: string;
	settings: string;
	home: string;

	// Profiles & garage
	profile: (index: number) => string;
	carLocked: (driver: string, stars: number) => string;
	race: string;
	chooseCircuit: string;

	// Race HUD
	pause: string;
	paused: string;
	raceTrack: string;
	keyboardHint: string;
	resume: string;
	restart: string;
	tutorial: string;
	mute: string;
	unmute: string;
	steerLeft: string;
	steerRight: string;
	boost: string;
	autoSteering: string;
	dragToSteer: string;
	speed: (kmh: number) => string;
	balloons: (count: number) => string;
	lap: (lap: number, laps: number) => string;
	boostCharges: (count: number) => string;
	stars: (count: number) => string;

	// Results
	raceResults: string;
	raceAgain: string;
	backToGarage: string;
	balloonTally: (collected: number, total: number) => string;
	trophy: string;

	// Settings
	sound: string;
	music: string;
	effects: string;
	language: string;
	calm: string;
	advanced: string;
	installApp: string;
	resetProfile: string;
	toggleSound: string;
	toggleMotion: string;
	toggleAdvanced: string;
	resetHold: string;

	// iOS install guidance
	installTitle: string;
	installNotSafari: string;
	installOffline: string;
	installStep1: string;
	installStep2: string;
	installStep3: string;
	installDone: string;
	installNever: string;
	dismiss: string;

	// Rotation
	rotate: string;

	// Tutorial
	tutorialTitle: string;
	skipTutorial: string;
	next: string;
	startRacing: string;
	tutorialSteps: string[];
	tutorialDrag: string;
}

const IT: Messages = {
	back: 'Indietro',
	close: 'Chiudi',
	closeSettings: 'Chiudi impostazioni',
	settings: 'Impostazioni',
	home: 'Garage',

	profile: (index) => `Profilo ${index}`,
	carLocked: (driver, stars) => `${driver} bloccata, servono ${stars} stelle`,
	race: 'Corri',
	chooseCircuit: 'Scegli il circuito',

	pause: 'Pausa',
	paused: 'In pausa',
	raceTrack: 'Pista di Zoom Town',
	keyboardHint: 'Tastiera: ← → sterza · Spazio turbo · P pausa',
	resume: 'Riprendi',
	restart: 'Ricomincia',
	tutorial: 'Tutorial',
	mute: 'Muto',
	unmute: 'Attiva audio',
	steerLeft: 'Sterza a sinistra',
	steerRight: 'Sterza a destra',
	boost: 'Turbo',
	autoSteering: 'Sterzo automatico',
	dragToSteer: 'Trascina a sinistra o a destra per sterzare',
	speed: (kmh) => `Velocità ${kmh} chilometri orari`,
	balloons: (count) => `${count} palloncini`,
	lap: (lap, laps) => `Giro ${lap} di ${laps}`,
	boostCharges: (count) => `${count} turbo`,
	stars: (count) => `${count} stelle su 3`,

	raceResults: 'Risultato della gara',
	raceAgain: 'Corri di nuovo',
	backToGarage: 'Torna al garage',
	balloonTally: (collected, total) => `${collected} di ${total} palloncini`,
	trophy: 'Trofeo',

	sound: 'Suono',
	music: 'Musica',
	effects: 'Effetti',
	language: 'Lingua',
	calm: 'Calmo',
	advanced: 'Avanzata',
	installApp: 'Installa app',
	resetProfile: 'Azzera profilo',
	toggleSound: 'Attiva o disattiva il suono',
	toggleMotion: 'Attiva o disattiva il movimento ridotto',
	toggleAdvanced: 'Attiva o disattiva la guida avanzata',
	resetHold: 'Tieni premuto tre secondi per azzerare questo profilo',

	installTitle: 'Installa Zoom Town',
	installNotSafari: 'Apri questa pagina in Safari per installarla.',
	installOffline: 'Si apre a schermo intero e funziona anche offline.',
	installStep1: 'Tocca il pulsante Condividi.',
	installStep2: 'Scegli Aggiungi alla schermata Home.',
	installStep3: 'Tocca Aggiungi. Fatto!',
	installDone: 'Ho capito',
	installNever: 'Non mostrare più',
	dismiss: 'Chiudi',

	rotate: 'Mettimi in verticale',

	tutorialTitle: 'Tutorial',
	skipTutorial: 'Salta il tutorial',
	next: 'Avanti',
	startRacing: 'Inizia a correre',
	tutorialSteps: [
		'Tieni premuto a sinistra o a destra per sterzare.',
		'Tocca il pulsante grande per il turbo.',
		'Raccogli i palloncini per guadagnare stelle.'
	],
	tutorialDrag: 'Trascina il dito a sinistra o a destra per sterzare.'
};

const EN: Messages = {
	back: 'Back',
	close: 'Close',
	closeSettings: 'Close settings',
	settings: 'Settings',
	home: 'Garage',

	profile: (index) => `Profile ${index}`,
	carLocked: (driver, stars) => `${driver} locked, needs ${stars} stars`,
	race: 'Race',
	chooseCircuit: 'Choose a circuit',

	pause: 'Pause',
	paused: 'Paused',
	raceTrack: 'Zoom Town race track',
	keyboardHint: 'Keyboard: ← → steer · Space boost · P pause',
	resume: 'Resume',
	restart: 'Restart race',
	tutorial: 'Tutorial',
	mute: 'Mute',
	unmute: 'Unmute',
	steerLeft: 'Steer left',
	steerRight: 'Steer right',
	boost: 'Boost',
	autoSteering: 'Auto steering',
	dragToSteer: 'Drag left or right to steer',
	speed: (kmh) => `Speed ${kmh} kilometres per hour`,
	balloons: (count) => `${count} balloons`,
	lap: (lap, laps) => `Lap ${lap} of ${laps}`,
	boostCharges: (count) => `${count} boosts`,
	stars: (count) => `${count} of 3 stars`,

	raceResults: 'Race results',
	raceAgain: 'Race again',
	backToGarage: 'Back to garage',
	balloonTally: (collected, total) => `${collected} of ${total} balloons`,
	trophy: 'Trophy',

	sound: 'Sound',
	music: 'Music',
	effects: 'Effects',
	language: 'Language',
	calm: 'Calm',
	advanced: 'Advanced',
	installApp: 'Install app',
	resetProfile: 'Reset profile',
	toggleSound: 'Toggle sound',
	toggleMotion: 'Toggle reduced motion',
	toggleAdvanced: 'Toggle advanced driving',
	resetHold: 'Hold three seconds to reset this profile',

	installTitle: 'Install Zoom Town',
	installNotSafari: 'Open this page in Safari to install it.',
	installOffline: 'It opens full-screen and works offline too.',
	installStep1: 'Tap the Share button.',
	installStep2: 'Choose Add to Home Screen.',
	installStep3: 'Tap Add. Done!',
	installDone: 'Got it',
	installNever: "Don't show again",
	dismiss: 'Dismiss',

	rotate: 'Turn me upright',

	tutorialTitle: 'Tutorial',
	skipTutorial: 'Skip tutorial',
	next: 'Next',
	startRacing: 'Start racing',
	tutorialSteps: [
		'Hold left or right to steer.',
		'Tap the big button to boost.',
		'Collect balloons to earn stars.'
	],
	tutorialDrag: 'Drag your finger left or right to steer.'
};

export const MESSAGES: Record<Lang, Messages> = { it: IT, en: EN };

export function messages(lang: Lang): Messages {
	return MESSAGES[lang] ?? MESSAGES.it;
}
