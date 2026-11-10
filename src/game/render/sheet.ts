import { KIND_ACTOR, KIND_GLYPH, KIND_ICON, KIND_PLAIN, KIND_ROTATED, KIND_ROTATED_OUTLINED, type SpriteDef } from './atlas.ts'
import { playerIdleA, playerIdleB, playerWalkA, playerWalkB, playerWalkC, playerWalkD } from '../sprites/player.ts'
import { scoutA, scoutB } from '../sprites/scout.ts'
import { gruntA, gruntB } from '../sprites/grunt.ts'
import { strikerA, strikerB } from '../sprites/striker.ts'
import { tankA, tankB } from '../sprites/tank.ts'
import { heavyA, heavyB } from '../sprites/heavy.ts'
import { aceA, aceB } from '../sprites/ace.ts'
import { dreadnoughtA, dreadnoughtB } from '../sprites/dreadnought.ts'
import { cellLarge, cellMedium, cellSmall, magnet, repairKit } from '../sprites/pickups.ts'
import { beamBolt, missile, particleLance, vulcanRound } from '../sprites/shots.ts'
import { orbitDrone } from '../sprites/drone.ts'
import { muzzleFrames, orbBright, orbDim, shard, shell } from '../sprites/bullets.ts'
import { debrisFrames, glintFrames, hudMarkFrames, sparkFrames } from '../sprites/effects.ts'
import { fontFrames } from '../sprites/font.ts'
import {
  decalArrow, decalHatch, decalHazard, decalOil, decalVent, deckLaneCross, deckLaneH, deckLaneV, deckPad,
  floorPlate, floorPlateGrate, floorPlateTread, floorPlateWorn,
} from '../sprites/floor.ts'
import { deckDigitFrames } from '../sprites/deck-digits.ts'
import { hangarA, hangarB } from '../sprites/prop-hangar.ts'
import { generatorA, generatorB } from '../sprites/prop-generator.ts'
import { fuelTank } from '../sprites/prop-fuel-tank.ts'
import { crates } from '../sprites/prop-crates.ts'
import { house } from '../sprites/prop-house.ts'
import { wreck } from '../sprites/prop-wreck.ts'
import { rock } from '../sprites/prop-rock.ts'
import { cactus } from '../sprites/prop-cactus.ts'
import { domeA, domeB } from '../sprites/prop-dome.ts'
import { iceBoulder } from '../sprites/prop-ice-boulder.ts'
import { pine } from '../sprites/prop-pine.ts'
import { mastA, mastB } from '../sprites/prop-mast.ts'
import { powerPlantA, powerPlantB } from '../sprites/prop-power-plant.ts'
import { smelterA, smelterB } from '../sprites/prop-smelter.ts'
import { spire } from '../sprites/prop-spire.ts'
import { pylonA, pylonB } from '../sprites/prop-pylon.ts'
import { propShadowFrames } from '../sprites/prop-shadows.ts'
import { propAnchorX, propAnchorY, propShadowX, propShadowY } from '../sprites/prop-anchors.ts'
import * as sand from '../sprites/ground-sand.ts'
import * as ice from '../sprites/ground-ice.ts'
import * as magma from '../sprites/ground-magma.ts'
import { groundEdgeFrames } from '../sprites/ground-edges.ts'
import { boundsHazardH, boundsHazardV, boundsWall } from '../sprites/bounds.ts'
import { thrustA, thrustB, thrustC } from '../sprites/thrust.ts'
import { scrapColossusA, scrapColossusB } from '../sprites/scrap-colossus.ts'
import { cryoLeviathanA, cryoLeviathanB } from '../sprites/cryo-leviathan.ts'
import { furnaceTitanA, furnaceTitanB } from '../sprites/furnace-titan.ts'
import { beaconLive, beaconPulse, beaconSpent } from '../sprites/beacon.ts'
import { lairOpen, lairSealed } from '../sprites/lair.ts'
import { arrowCyan, arrowRed } from '../sprites/arrows.ts'
import { iconBeamRifle } from '../sprites/icon-beam-rifle.ts'
import { iconPlasmaBlade } from '../sprites/icon-plasma-blade.ts'
import { iconVulcanPods } from '../sprites/icon-vulcan-pods.ts'
import { iconMicroMissiles } from '../sprites/icon-micro-missiles.ts'
import { iconOrbitDrones } from '../sprites/icon-orbit-drones.ts'
import { iconRepulsorField } from '../sprites/icon-repulsor-field.ts'
import { iconParticleLance } from '../sprites/icon-particle-lance.ts'
import { iconTwinArcBlades } from '../sprites/icon-twin-arc-blades.ts'
import { iconGatlingStorm } from '../sprites/icon-gatling-storm.ts'
import { iconSwarmBarrage } from '../sprites/icon-swarm-barrage.ts'
import { iconHaloArray } from '../sprites/icon-halo-array.ts'
import { iconMeltdownField } from '../sprites/icon-meltdown-field.ts'
import { iconTargetingComputer } from '../sprites/icon-targeting-computer.ts'
import { iconServoActuators } from '../sprites/icon-servo-actuators.ts'
import { iconAutoloader } from '../sprites/icon-autoloader.ts'
import { iconMultiLockArray } from '../sprites/icon-multi-lock-array.ts'
import { iconNeuralLink } from '../sprites/icon-neural-link.ts'
import { iconReactorCore } from '../sprites/icon-reactor-core.ts'
import { iconThrusterPack } from '../sprites/icon-thruster-pack.ts'
import { iconArmorPlating } from '../sprites/icon-armor-plating.ts'
import { iconSalvageMagnet } from '../sprites/icon-salvage-magnet.ts'
import { iconFieldRepair } from '../sprites/icon-field-repair.ts'
import {
  liftApron, liftDoorLeft, liftDoorRight, liftLampAmber, liftLampGreen, liftLampOff, liftLampRed,
  liftPlate, liftPlateLocked, liftSteamA, liftSteamB, liftSteamC, liftWall,
} from '../sprites/lift.ts'

export const SPR_PLAYER = 0
export const SPR_SCOUT = 1
export const SPR_GRUNT = 2
export const SPR_STRIKER = 3
export const SPR_TANK = 4
export const SPR_HEAVY = 5
export const SPR_ACE = 6
export const SPR_DREADNOUGHT = 7
export const SPR_GEMS = 8
export const SPR_SHOTS = 9
export const SPR_DRONE = 10
export const SPR_ICONS = 11
export const SPR_FONT = 12
export const SPR_DEBRIS = 13
export const SPR_SPARK = 14
export const SPR_GLINT = 15
export const SPR_HUD_MARKS = 16
export const SPR_FLOOR = 17
export const SPR_THRUST = 18
export const SPR_SCRAP_COLOSSUS = 19
export const SPR_CRYO_LEVIATHAN = 20
export const SPR_FURNACE_TITAN = 21
export const SPR_BOUNDS = 22
export const SPR_POI = 23
export const SPR_ARROWS = 24
export const SPR_GROUND = 25
export const SPR_EDGES = 26
export const SPR_DECK_DIGITS = 27
export const SPR_PROPS = 28
export const SPR_PROP_SHADOWS = 29
export const SPR_ORBS = 30
export const SPR_HOSTILE_SHOTS = 31
export const SPR_MUZZLE = 32
export const SPR_LIFT = 33

export const LIFT_APRON = 0
export const LIFT_WALL = 1
export const LIFT_PLATE = 2
export const LIFT_PLATE_LOCKED = 3
export const LIFT_DOOR_LEFT = 4
export const LIFT_DOOR_RIGHT = 5
export const LIFT_LAMP_OFF = 6
export const LIFT_LAMP_RED = 7
export const LIFT_LAMP_AMBER = 8
export const LIFT_LAMP_GREEN = 9
export const LIFT_STEAM_FIRST = 10
export const LIFT_STEAM_COUNT = 3

export const HOSTILE_SHOT_SHELL = 0
export const HOSTILE_SHOT_SHARD = 1
export const ORB_FRAME_COUNT = 2
export const MUZZLE_FRAME_COUNT = 3

export const ENEMY_SPRITE = Uint8Array.of(
  SPR_SCOUT,
  SPR_GRUNT,
  SPR_STRIKER,
  SPR_TANK,
  SPR_HEAVY,
  SPR_ACE,
  SPR_DREADNOUGHT,
  SPR_SCRAP_COLOSSUS,
  SPR_CRYO_LEVIATHAN,
  SPR_FURNACE_TITAN,
)

export const PLAYER_FRAME_IDLE_COUNT = 2
export const PLAYER_FRAME_WALK_COUNT = 4
export const THRUST_FRAME_COUNT = 3

export const PLAYER_FRAME_IDLE = 0
export const PLAYER_FRAME_WALK = 2

export const ICON_EVOLVED_FIRST = 6
export const ICON_PASSIVE_FIRST = 12
export const ICON_REPAIR = 21
export const ICON_SIZE = 16

export const HUD_MARK_KILLS = 0
export const HUD_MARK_LEVEL = 1
export const HUD_MARK_SKULL_RED = 2
export const HUD_MARK_SKULL_PIP = 3

export const DEBRIS_PLAYER_FRAME = 10

export const FLOOR_PLATE = 0
export const FLOOR_PLATE_WORN = 1
export const FLOOR_PLATE_GRATE = 2
export const FLOOR_PLATE_TREAD = 3
export const FLOOR_DECAL_FIRST = 4
export const FLOOR_DECAL_COUNT = 5
export const FLOOR_LANE_V = 9
export const FLOOR_LANE_H = 10
export const FLOOR_LANE_CROSS = 11
export const FLOOR_PAD = 12
export const DECK_DIGIT_W = 5
export const DECK_DIGIT_H = 7

export const GROUND_PATCH_LOW = 0
export const GROUND_PATCH_HIGH = 1
export const GROUND_FEATURE_A = 2
export const GROUND_FEATURE_B = 3
export const GROUND_SPECK = 4
export const GROUND_GLOW = 5
export const GROUND_RARE = 6
export const GROUND_CATEGORIES = 7

type Frames = readonly (readonly string[])[]

const GROUND_SETS: readonly (readonly Frames[])[] = [
  [[], [], [], [], [], [], []],
  [
    [sand.sandShadeA, sand.sandShadeB, sand.sandShadeC],
    [sand.sandDriftA, sand.sandDriftB, sand.sandDriftC],
    [
      sand.sandRippleA, sand.sandRippleB, sand.sandRippleC, sand.sandRippleD,
      sand.sandDuneA, sand.sandDuneB, sand.sandDuneC,
    ],
    [sand.sandCrackedA, sand.sandCrackedB, sand.sandCrackedC, sand.sandShrub],
    [sand.sandPebblesA, sand.sandPebblesB, sand.sandPebbleC, sand.sandGrainsA, sand.sandGrainsB, sand.sandDash],
    [],
    [sand.sandScrap, sand.sandPipe, sand.sandBones, sand.sandSkull, sand.sandTracks],
  ],
  [
    [ice.iceDeepA, ice.iceDeepB, ice.iceDeepC],
    [ice.iceSnowA, ice.iceSnowB, ice.iceSnowC],
    [
      ice.iceCrackA, ice.iceCrackB, ice.iceCrackC, ice.iceCrackD, ice.iceCrackE,
      ice.icePoolA, ice.icePoolB, ice.icePoolC, ice.iceGlossA, ice.iceGlossB,
    ],
    [ice.iceDriftA, ice.iceDriftB, ice.iceSastrugiA, ice.iceSastrugiB, ice.iceCrackB, ice.iceGlossA],
    [ice.iceGlintA, ice.iceGlintB, ice.iceShardA, ice.iceShardB, ice.iceFlakesA, ice.iceFlakesB, ice.iceFrost],
    [],
    [],
  ],
  [
    [magma.magmaObsidianA, magma.magmaObsidianB, magma.magmaObsidianC],
    [magma.magmaAshA, magma.magmaAshB, magma.magmaAshC],
    [magma.magmaCrustA, magma.magmaCrustB, magma.magmaCrustC, magma.magmaCrustD],
    [magma.magmaRubbleA, magma.magmaRubbleB, magma.magmaRubbleC, magma.magmaCrustC],
    [magma.magmaGrainsA, magma.magmaGrainsB, magma.magmaPebble, magma.magmaFissure],
    [
      magma.magmaVeinADim, magma.magmaVeinABright, magma.magmaVeinBDim, magma.magmaVeinBBright,
      magma.magmaVeinCDim, magma.magmaVeinCBright, magma.magmaPoolADim, magma.magmaPoolABright,
      magma.magmaPoolBDim, magma.magmaPoolBBright, magma.magmaEmberADim, magma.magmaEmberABright,
      magma.magmaEmberBDim, magma.magmaEmberBBright,
    ],
    [],
  ],
]

const groundFrames: (readonly string[])[] = []
export const GROUND_FIRST = new Uint16Array(GROUND_SETS.length * GROUND_CATEGORIES)
export const GROUND_COUNT = new Uint8Array(GROUND_SETS.length * GROUND_CATEGORIES)
for (let zone = 0; zone < GROUND_SETS.length; zone++) {
  for (let category = 0; category < GROUND_CATEGORIES; category++) {
    const frames = GROUND_SETS[zone]![category]!
    GROUND_FIRST[zone * GROUND_CATEGORIES + category] = groundFrames.length
    GROUND_COUNT[zone * GROUND_CATEGORIES + category] = category === GROUND_GLOW ? frames.length >> 1 : frames.length
    groundFrames.push(...frames)
  }
}

const PROP_ART: readonly Frames[] = [
  [hangarA, hangarB], [generatorA, generatorB], [fuelTank], [crates],
  [house], [wreck], [rock], [cactus],
  [domeA, domeB], [iceBoulder], [pine], [mastA, mastB],
  [powerPlantA, powerPlantB], [smelterA, smelterB], [spire], [pylonA, pylonB],
]

const propFrames: (readonly string[])[] = []
export const PROP_FRAME_FIRST = new Uint8Array(PROP_ART.length)
export const PROP_FRAME_COUNT = new Uint8Array(PROP_ART.length)
for (let kind = 0; kind < PROP_ART.length; kind++) {
  PROP_FRAME_FIRST[kind] = propFrames.length
  PROP_FRAME_COUNT[kind] = PROP_ART[kind]!.length
  propFrames.push(...PROP_ART[kind]!)
}
export const PROP_ANCHOR_X = Uint8Array.from(propAnchorX)
export const PROP_ANCHOR_Y = Uint8Array.from(propAnchorY)
export const PROP_SHADOW_X = Uint8Array.from(propShadowX)
export const PROP_SHADOW_Y = Uint8Array.from(propShadowY)

export const EDGE_SHAPES = 3
export const EDGE_EAST = 0
export const EDGE_WEST = 1
export const EDGE_SOUTH = 2
export const EDGE_NORTH = 3
export const EDGE_DIRECTIONS = 4

export const BOUNDS_WALL = 0
export const BOUNDS_HAZARD_H = 1
export const BOUNDS_HAZARD_V = 2

export const POI_FRAME_BEACON = 0
export const POI_FRAME_BEACON_PULSE = 1
export const POI_FRAME_BEACON_SPENT = 2
export const POI_FRAME_LAIR = 3
export const POI_FRAME_LAIR_OPEN = 4
export const BEACON_ANCHOR_X = 12
export const BEACON_ANCHOR_Y = 21

export const ARROW_CYAN = 0
export const ARROW_RED = 1

export const FONT_ADVANCE = 4
export const FONT_HEIGHT = 5

export const SPRITE_DEFS: readonly SpriteDef[] = [
  { name: 'player', kind: KIND_ACTOR, frames: [playerIdleA, playerIdleB, playerWalkA, playerWalkB, playerWalkC, playerWalkD] },
  { name: 'scout', kind: KIND_ACTOR, frames: [scoutA, scoutB] },
  { name: 'grunt', kind: KIND_ACTOR, frames: [gruntA, gruntB] },
  { name: 'striker', kind: KIND_ACTOR, frames: [strikerA, strikerB] },
  { name: 'tank', kind: KIND_ACTOR, frames: [tankA, tankB] },
  { name: 'heavy', kind: KIND_ACTOR, frames: [heavyA, heavyB] },
  { name: 'ace', kind: KIND_ACTOR, frames: [aceA, aceB] },
  { name: 'dreadnought', kind: KIND_ACTOR, frames: [dreadnoughtA, dreadnoughtB] },
  { name: 'gems', kind: KIND_PLAIN, frames: [cellSmall, cellMedium, cellLarge, repairKit, magnet] },
  { name: 'shots', kind: KIND_ROTATED, frames: [beamBolt, particleLance, vulcanRound, missile] },
  { name: 'drone', kind: KIND_PLAIN, frames: [orbitDrone] },
  {
    name: 'icons',
    kind: KIND_ICON,
    frames: [
      iconBeamRifle, iconPlasmaBlade, iconVulcanPods, iconMicroMissiles, iconOrbitDrones, iconRepulsorField,
      iconParticleLance, iconTwinArcBlades, iconGatlingStorm, iconSwarmBarrage, iconHaloArray, iconMeltdownField,
      iconTargetingComputer, iconServoActuators, iconAutoloader, iconMultiLockArray, iconNeuralLink, iconReactorCore,
      iconThrusterPack, iconArmorPlating, iconSalvageMagnet,
      iconFieldRepair,
    ],
  },
  { name: 'font', kind: KIND_GLYPH, frames: fontFrames },
  { name: 'debris', kind: KIND_PLAIN, frames: debrisFrames },
  { name: 'spark', kind: KIND_PLAIN, frames: sparkFrames },
  { name: 'glint', kind: KIND_PLAIN, frames: glintFrames },
  { name: 'hud-marks', kind: KIND_PLAIN, frames: hudMarkFrames },
  {
    name: 'floor',
    kind: KIND_PLAIN,
    frames: [
      floorPlate, floorPlateWorn, floorPlateGrate, floorPlateTread,
      decalVent, decalHazard, decalArrow, decalHatch, decalOil,
      deckLaneV, deckLaneH, deckLaneCross, deckPad,
    ],
  },
  { name: 'thrust', kind: KIND_ACTOR, frames: [thrustA, thrustB, thrustC] },
  { name: 'scrap-colossus', kind: KIND_ACTOR, frames: [scrapColossusA, scrapColossusB] },
  { name: 'cryo-leviathan', kind: KIND_ACTOR, frames: [cryoLeviathanA, cryoLeviathanB] },
  { name: 'furnace-titan', kind: KIND_ACTOR, frames: [furnaceTitanA, furnaceTitanB] },
  { name: 'bounds', kind: KIND_PLAIN, frames: [boundsWall, boundsHazardH, boundsHazardV] },
  { name: 'poi', kind: KIND_PLAIN, frames: [beaconLive, beaconPulse, beaconSpent, lairSealed, lairOpen] },
  { name: 'arrows', kind: KIND_ROTATED, frames: [arrowCyan, arrowRed] },
  { name: 'ground', kind: KIND_PLAIN, frames: groundFrames },
  { name: 'edges', kind: KIND_PLAIN, frames: groundEdgeFrames },
  { name: 'deck-digits', kind: KIND_PLAIN, frames: deckDigitFrames },
  { name: 'props', kind: KIND_PLAIN, frames: propFrames },
  { name: 'prop-shadows', kind: KIND_PLAIN, frames: propShadowFrames },
  { name: 'orbs', kind: KIND_PLAIN, frames: [orbBright, orbDim] },
  { name: 'hostile-shots', kind: KIND_ROTATED_OUTLINED, frames: [shell, shard] },
  { name: 'muzzle', kind: KIND_PLAIN, frames: muzzleFrames },
  {
    name: 'lift',
    kind: KIND_PLAIN,
    frames: [
      liftApron, liftWall, liftPlate, liftPlateLocked, liftDoorLeft, liftDoorRight,
      liftLampOff, liftLampRed, liftLampAmber, liftLampGreen, liftSteamA, liftSteamB, liftSteamC,
    ],
  },
]
