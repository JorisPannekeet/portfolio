import { KIND_ACTOR, KIND_GLYPH, KIND_ICON, KIND_PLAIN, KIND_ROTATED, type SpriteDef } from './atlas.ts'
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
import { debrisFrames, glintFrames, hudMarkFrames, sparkFrames } from '../sprites/effects.ts'
import { fontFrames } from '../sprites/font.ts'
import { decalArrow, decalHatch, decalHazard, decalVent, floorPlate, floorPlateWorn } from '../sprites/floor.ts'
import { scrapHeap, scrapPlate, scrapPlateWorn, scrapTracks, scrapTyre, scrapWreck } from '../sprites/floor-scrapyard.ts'
import { cryoCrack, cryoPlate, cryoPlateWorn, cryoPool, cryoShards, cryoVent } from '../sprites/floor-cryo.ts'
import { foundryCrack, foundryPlate, foundryPlateWorn, foundrySeam, foundrySlag, foundryVent } from '../sprites/floor-foundry.ts'
import { boundsHazardH, boundsHazardV, boundsSeamH, boundsSeamV, boundsWall } from '../sprites/bounds.ts'
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
export const FLOOR_DECAL_FIRST = 2
export const FLOOR_DECAL_COUNT = 4
export const FLOOR_ZONE_STRIDE = FLOOR_DECAL_FIRST + FLOOR_DECAL_COUNT

export const BOUNDS_WALL = 0
export const BOUNDS_HAZARD_H = 1
export const BOUNDS_HAZARD_V = 2
export const BOUNDS_SEAM_H = 3
export const BOUNDS_SEAM_V = 4

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
      floorPlate, floorPlateWorn, decalVent, decalHazard, decalArrow, decalHatch,
      scrapPlate, scrapPlateWorn, scrapWreck, scrapTracks, scrapHeap, scrapTyre,
      cryoPlate, cryoPlateWorn, cryoCrack, cryoPool, cryoShards, cryoVent,
      foundryPlate, foundryPlateWorn, foundrySeam, foundryVent, foundrySlag, foundryCrack,
    ],
  },
  { name: 'thrust', kind: KIND_ACTOR, frames: [thrustA, thrustB, thrustC] },
  { name: 'scrap-colossus', kind: KIND_ACTOR, frames: [scrapColossusA, scrapColossusB] },
  { name: 'cryo-leviathan', kind: KIND_ACTOR, frames: [cryoLeviathanA, cryoLeviathanB] },
  { name: 'furnace-titan', kind: KIND_ACTOR, frames: [furnaceTitanA, furnaceTitanB] },
  { name: 'bounds', kind: KIND_PLAIN, frames: [boundsWall, boundsHazardH, boundsHazardV, boundsSeamH, boundsSeamV] },
  { name: 'poi', kind: KIND_PLAIN, frames: [beaconLive, beaconPulse, beaconSpent, lairSealed, lairOpen] },
  { name: 'arrows', kind: KIND_ROTATED, frames: [arrowCyan, arrowRed] },
]
