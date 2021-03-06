// Copyright 2014-2015, University of Colorado Boulder

/**
 * A round toggle button that switches the value of a property between 2 values.
 *
 * @author John Blanco
 * @author Sam Reid
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var RoundButtonView = require( 'SUN/buttons/RoundButtonView' );
  var sun = require( 'SUN/sun' );
  var ToggleButtonInteractionStateProperty = require( 'SUN/buttons/ToggleButtonInteractionStateProperty' );
  var ToggleButtonModel = require( 'SUN/buttons/ToggleButtonModel' );
  var Tandem = require( 'TANDEM/Tandem' );

  /**
   * @param {Object} valueOff - value when the button is in the off state
   * @param {Object} valueOn - value when the button is in the on state
   * @param {Property} property - axon Property that can be either valueOff or valueOn
   * @param {Object} [options]
   * @constructor
   */
  function RoundToggleButton( valueOff, valueOn, property, options ) {

    var thisRoundToggleButton = this;

    // Tandem support
    options = _.extend( { tandem: null }, options );
    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'

    this.toggleButtonModel = new ToggleButtonModel( valueOff, valueOn, property ); // @public, listen only
    RoundButtonView.call( this, this.toggleButtonModel, new ToggleButtonInteractionStateProperty( this.toggleButtonModel ), options );

    // Tandem support
    options.tandem && options.tandem.addInstance( this );

    // @private - disposal for listener above
    this.disposeRoundToggleButton = function() {
      options.tandem && options.tandem.removeInstance( this );
      thisRoundToggleButton.toggleButtonModel.dispose();
    };
  }

  sun.register( 'RoundToggleButton', RoundToggleButton );

  return inherit( RoundButtonView, RoundToggleButton, {

    // @public
    dispose: function() {
      this.disposeRoundToggleButton(); //TODO this fails with assertions enabled, see sun#212
    }
  } );
} );