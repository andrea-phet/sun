// Copyright 2002-2013, University of Colorado Boulder

/**
 * Check box.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */
define( function( require ) {
  'use strict';

  // imports
  var ButtonListener = require( 'SCENERY/input/ButtonListener' );
  var FontAwesomeNode = require( 'SUN/FontAwesomeNode' );
  var Image = require( 'SCENERY/nodes/Image' );
  var inherit = require( 'PHET_CORE/inherit' );
  var Node = require( 'SCENERY/nodes/Node' );
  var Rectangle = require( 'SCENERY/nodes/Rectangle' );
  var Shape = require( 'KITE/Shape' );
  var Text = require( 'SCENERY/nodes/Text' );

  /**
   * @param {Node} content
   * @param {Property<Boolean>} property
   * @constructor
   * @param options
   */
  function CheckBox( content, property, options ) {
    var checkBox = this;
    options = _.extend( {
      spacing: 5,
      boxScale: 0.6,
      cursor: 'pointer',
      checkBoxColor: 'black',
      checkBoxColorDisabled: 'gray'
    }, options );

    var thisNode = this;
    Node.call( this );

    // save this stuff for use in prototype functions
    thisNode._options = options;
    thisNode._content = content;
    thisNode._enabled = true;

    var x = options.boxScale / 0.75;

    //Make the background white.  Until we are creating our own shapes, just put a white rectangle behind the font awesome check box icons
    var whiteBackground = new Rectangle( 0, -25 * x, 25 * x, 25 * x, 5 * x, 5 * x, {fill: 'white'} );

    thisNode._checkedNode = new FontAwesomeNode( 'check', { scale: options.boxScale, fill: options.checkBoxColor } );
    thisNode._uncheckedNode = new FontAwesomeNode( 'check_empty', { scale: options.boxScale, fill: options.checkBoxColor } );

    thisNode.addChild( whiteBackground );
    thisNode.addChild( thisNode._checkedNode );
    thisNode.addChild( thisNode._uncheckedNode );
    thisNode.addChild( content );

    content.left = thisNode._checkedNode.right + options.spacing;
    content.centerY = thisNode._checkedNode.centerY;

    // put a rectangle on top of everything to prevent dead zones when clicking
    thisNode.addChild( new Rectangle( thisNode.left, thisNode.top, thisNode.width, thisNode.height ) );

    content.pickable = false; // since there's a pickable rectangle on top of content

    // interactivity
    thisNode.addInputListener( new ButtonListener( {
      fire: function() {
        if ( thisNode._enabled ) {
          property.value = !property.value;
        }
      }
    } ) );

    // sync with property
    property.link( function( checked ) {
      thisNode._checkedNode.visible = checked;
      thisNode._uncheckedNode.visible = !checked;
    } );

    //Add accessibility
    thisNode.addPeer( '<input type="checkbox">', {click: function() {property.value = !property.value;}, label: options.label} );
    property.link( function( value ) {
      _.each( checkBox.instances, function( instance ) {

        //Make sure accessibility is enabled, then apply the change to the peer
        _.each( instance.peers, function( peer ) {
          peer.element.setAttribute( 'checked', value );
        } );
      } );
    } );

    // Apply additional options
    thisNode.mutate( options );
  }

  return inherit( Node, CheckBox, {

    // prototype properties

    get enabled() { return this._enabled; },

    set enabled( value ) {

      this._enabled = value;

      // set the color of the check box icons
      this._checkedNode.fill = value ? this._options.checkBoxColor : this._options.checkBoxColorDisabled;
      this._uncheckedNode.fill = this._checkedNode.fill;
      
      // enable/disable the content, if it supports it
      if ( this._content.setEnabled ) {
        this._content.setEnabled( value );
      }
    }
    
  }, {

    // static properties

    /**
     * Factory method, creates a check box with a text label and optional icon.
     * @param {String} text
     * @param {*} textOptions options that apply to the text, same as scenery.Text
     * @param {Property<Boolean>} property
     * @returns {CheckBox}
     */
    createTextCheckBox: function( text, textOptions, property, checkBoxOptions ) {

      textOptions = _.extend( {
        fill: 'black',
        fillDisabled: 'rgb(220,220,220)'
      }, textOptions );

      checkBoxOptions = _.extend( {
        icon: null,  // an optional node, added to the right of the text
        iconSpacing: 15
      }, checkBoxOptions );

      var content = new Node();

      // text
      var textNode = new Text( text, textOptions );
      content.addChild( textNode );

      // options icon
      if ( checkBoxOptions.icon ) {
        content.addChild( checkBoxOptions.icon );
        //TODO support different layouts of text and image?
        checkBoxOptions.icon.left = textNode.right + checkBoxOptions.iconSpacing;
        checkBoxOptions.icon.centerY = textNode.centerY;
      }

      content.setEnabled = function( enabled ) {
        textNode.fill = enabled ? textOptions.fill : textOptions.fillDisabled;
        // enabled/disable the content if it implements setEnabled
        if ( checkBoxOptions.icon && checkBoxOptions.icon.setEnabled ) {
          checkBoxOptions.icon.setEnabled( enabled );
        }
      };

      return new CheckBox( content, property, checkBoxOptions );
    }
  } );
} );