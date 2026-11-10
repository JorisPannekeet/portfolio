import { KIND_ACTOR, KIND_GLYPH, KIND_ICON, KIND_PLAIN, KIND_ROTATED, type SpriteDef } from './atlas.ts'
import { playerIdle, playerWalkA, playerWalkB } from '../sprites/player.ts'
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
export const SPR_ENEMY_FIRST = 1
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

export const PLAYER_FRAME_IDLE = 0
export const PLAYER_FRAME_WALK = 1

export const ICON_EVOLVED_FIRST = 6
export const ICON_PASSIVE_FIRST = 12
export const ICON_REPAIR = 21
export const ICON_SIZE = 16

export const HUD_MARK_KILLS = 0
export const HUD_MARK_LEVEL = 1

export const FLOOR_PLATE = 0
export const FLOOR_PLATE_WORN = 1
export const FLOOR_DECAL_FIRST = 2
export const FLOOR_DECAL_COUNT = 4

export const FONT_ADVANCE = 4
export const FONT_HEIGHT = 5

export const SPRITE_DEFS: readonly SpriteDef[] = [
  { name: 'player', kind: KIND_ACTOR, frames: [playerIdle, playerWalkA, playerWalkB] },
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
  { name: 'floor', kind: KIND_PLAIN, frames: [floorPlate, floorPlateWorn, decalVent, decalHazard, decalArrow, decalHatch] },
]
