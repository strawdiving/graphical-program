
import {stencil} from './stencil.js'
import {inspector} from './inspector.js'
import {toolbar} from './toolbar.js'
import {halo} from './halo.js'
import {selection} from './selection.js'

let config = config || {};

config.stencil = stencil;
config.inspector = inspector;
config.selection = selection;
config.toolbar = toolbar;
config.halo = halo;

export {config};
