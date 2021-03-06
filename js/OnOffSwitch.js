// Copyright 2014-2015, University of Colorado Boulder

/**
 * On/off switch, similar to iOS' UISwitch, used in iOS `'Settings' app.
 * Off (false) is to the left, on (true) is to the right.
 *
 * Interaction behavior is as follows:
 * Drag the thumb to change the value, or click anywhere to toggle the value.
 * If you click without dragging, it's a toggle.
 * If you drag but don't cross the midpoint of the track, then it's a toggle.
 * If you drag past the midpoint of the track, releasing the thumb snaps to whichever end the thumb is closest to.
 * If you drag the thumb far enough to the side (outside of the switch), it will immediately toggle the model behavior.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Jonathan Olson (jonathan.olson@colorado.edu)
 */
define( function( require ) {
  'use strict';

  // modules
  var Dimension2 = require( 'DOT/Dimension2' );
  var Vector2 = require( 'DOT/Vector2' );
  var Util = require( 'DOT/Util' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Shape = require( 'KITE/Shape' );
  var SimpleDragHandler = require( 'SCENERY/input/SimpleDragHandler' );
  var sun = require( 'SUN/sun' );
  var Tandem = require( 'TANDEM/Tandem' );

  /**
   * @param {Property.<boolean>} onProperty
   * @param {Object} [options]
   * @constructor
   */
  function OnOffSwitch( onProperty, options ) {

    options = _.extend( {
      size: new Dimension2( 60, 30 ), // if you want the thumb to be a circle, use width that is 2x height
      cursor: 'pointer',
      thumbFill: 'white',
      thumbStroke: 'black',
      trackOffFill: 'white', // track fill when onProperty is false
      trackOnFill: 'rgb(0,200,0)', // track fill when onProperty is true
      trackStroke: 'black',
      toggleWhileDragging: null, // controls the behavior of when model value changes occur during dragging (if any)
                                 // true: triggers model changes whenever the thumb crosses sides
                                 // null (default: triggers model changes when thumb is dragged far enough to the side
                                 //      NOTE: this is also the iOS behavior
                                 // false: only trigger model changes until release
      dragThreshold: 3, // number of view-space units the drag needs to cover to be considered a "drag" instead of a "click/tap"
      toggleThreshold: 1, // number of thumb-widths outside the normal range past where the model value will change
      tandem: null
    }, options );

    Tandem.validateOptions( options ); // The tandem is required when brand==='phet-io'

    var thisNode = this;
    Node.call( thisNode );

    // track that the thumb slides in
    var cornerRadius = options.size.height / 2;
    var trackNode = this.trackNode = new Rectangle( 0, 0, options.size.width, options.size.height, cornerRadius, cornerRadius, {
      fill: options.trackOffFill,
      stroke: options.trackStroke,
      cachedPaints: [ options.trackOnFill, options.trackOffFill ]
    } );
    thisNode.addChild( trackNode );

    // thumb (aka knob)
    var thumbNode = this.thumbNode = new Rectangle( 0, 0, 0.5 * options.size.width, options.size.height, cornerRadius, cornerRadius, {
      fill: options.thumbFill,
      stroke: options.thumbStroke
    } );
    thisNode.addChild( thumbNode );
    var touchAreaDilation = 0.25 * options.size.height;
    thumbNode.touchArea = Shape.roundRect( -touchAreaDilation, -touchAreaDilation, (0.5 * options.size.width) + (2 * touchAreaDilation), options.size.height + (2 * touchAreaDilation), cornerRadius, cornerRadius );

    // move thumb to on or off position
    var updateThumb = function( on ) {
      if ( on ) {
        thumbNode.right = options.size.width;
        trackNode.fill = options.trackOnFill;
      }
      else {
        thumbNode.left = 0;
        trackNode.fill = options.trackOffFill;
      }
    };

    // sync with onProperty
    onProperty.link( updateThumb.bind( thisNode ) );

    // thumb interactivity
    var dragThresholdSquared = options.dragThreshold * options.dragThreshold; // comparing squared magnitudes is a bit faster
    var accumulatedDelta = new Vector2(); // stores how far we are from where our drag started, in our local coordinate frame
    var passedDragThreshold = false; // whether we have dragged far enough to be considered for "drag" behavior (pick closest side), or "tap" behavior (toggle)

    thisNode.addInputListener( new SimpleDragHandler( {

      // only touch to snag when over the thumb (don't snag on the track itself)
      allowTouchSnag: function( evt ) {
        return _.contains( evt.trail.nodes, thumbNode );
      },

      start: function( evt, trail ) {
        // resets our state
        accumulatedDelta.setXY( 0, 0 ); // reset it mutably (less allocation)
        passedDragThreshold = false;
      },

      end: function( evt, trail ) {
        var oldValue = onProperty.get();

        // if moved past the threshold, choose value based on the side, otherwise just toggle
        var newValue = passedDragThreshold ? thisNode.thumbPositionToValue() : !onProperty.get();

        thisNode.trigger2( 'startedCallbacksForToggled', oldValue, newValue );

        onProperty.set( newValue );

        // update the thumb location (sanity check that it's here, only needs to be run if passedDragThreshold===true)
        updateThumb( onProperty.get() );

        thisNode.trigger0( 'endedCallbacksForToggled' );
      },

      drag: function( evt, trail ) {
        // center the thumb on the pointer's x-coordinate if possible (but clamp to left and right ends)
        var viewPoint = evt.currentTarget.globalToLocalPoint( evt.pointer.point );
        var halfThumbWidth = thumbNode.width / 2;
        thumbNode.centerX = Util.clamp( viewPoint.x, halfThumbWidth, options.size.width - halfThumbWidth );

        // whether the thumb is dragged outside of the possible range far enough beyond our threshold to potentially
        // trigger an immediate model change
        var isDraggedOutside = viewPoint.x < ( 1 - 2 * options.toggleThreshold ) * halfThumbWidth ||
                               viewPoint.x > ( -1 + 2 * options.toggleThreshold ) * halfThumbWidth + options.size.width;

        var value = thisNode.thumbPositionToValue(); // value represented by the current thumb position

        // track fill changes based on the thumb positions
        trackNode.fill = value ? options.trackOnFill : options.trackOffFill;

        if ( options.toggleWhileDragging === true || ( isDraggedOutside && options.toggleWhileDragging === null ) ) {

          // TODO: A way to distinguish between drag-to-toggle vs click-to-toggle
          thisNode.trigger2( 'startedCallbacksForToggled', !value, value );
          onProperty.set( value );
          thisNode.trigger0( 'endedCallbacksForToggled' );
        }
      },

      translate: function( params ) {
        accumulatedDelta.add( params.delta );
        passedDragThreshold = passedDragThreshold || ( accumulatedDelta.magnitudeSquared() > dragThresholdSquared );
      }
    } ) );

    // @public (tandem) - Tandem support, use a novel name to reduce the risk of parent or child collisions.
    this.onOffSwitchTandem = options.tandem;
    this.onOffSwitchTandem && this.onOffSwitchTandem.addInstance( this );

    thisNode.mutate( options );
  }

  sun.register( 'OnOffSwitch', OnOffSwitch );

  return inherit( Node, OnOffSwitch, {
    /*
     * Converts the thumb position to a boolean on/off value.
     * Off (false) is to the left, on (true) is to the right.
     */
    thumbPositionToValue: function() {
      return this.thumbNode.centerX > this.trackNode.centerX;
    }
  } );
} );
