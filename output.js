"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
/**************************************************************************************************
 * Qualtrics Google Map Lat/Long Collector
 * Modified from:
 * Written by George Walker <george@georgewwalker.com>
 * Get the latest from GitHub: https://github.com/pkmnct/qualtrics-google-map-lat-long/releases

 * This JavaScript allows a Qualtrics user to collect a lat/long from a
 * Google Map in a survey. To use it, create a new "Text Entry" question,
 * then add this JavaScript to the question. You can set variables below.
 * These include the latitude and longitude to center the map at, the
 * zoom level of the map, and the text to display when hovering over the
 * map's pin. It also includes the width and height of the map.

 * Modified by: Alec Moschetti 01/01/2023
 * Helpful links:
 * google maps docs: https://developers.google.com/maps/documentation
 * google maps API v3: https://developers.google.com/maps/documentation/javascript/reference
 * MapOptions interface: https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
 *************************************************************************************************/

Qualtrics.SurveyEngine.addOnload(function () {
  var PREFERRED_ZOOM = 18;

  // lat long object of map center on load
  var PORTLAND_CENTER = {
    lat: 45.5160179,
    lng: -122.681427
  };

  // lat long object of boundary restriction for map
  var PORTLAND_URBAN_BOUNDS = {
    north: 46.5,
    south: 44.75,
    west: -124.0,
    east: -121.5
  };

  // Inputs: The qualtrics survey quetion-id, question-container, and the google map instance
  // Outputs: Append a google map instance inside a qualtrics survey question through dom manipulation
  function initMap(id, container, map) {
    var dataBox = document.getElementById("QR~".concat(id));
    if (!dataBox) {
      return new Error("Could not find input for question with id ".concat(id, "."));
    }
    dataBox.style.display = 'none';

    // Find the QuestionBody to append to
    var questionBody = container.querySelector('.QuestionBody') || container;

    // Function to set the dataBox to a lat/lng
    function setLatLng(latLng) {
      dataBox.value = JSON.stringify(latLng);
    }
    var styles = document.createElement('style');
    document.head.appendChild(styles);

    // Create the map node
    var mapObject = document.createElement('div');
    mapObject.setAttribute('id', "".concat(id, "-map"));
    if (map.css) {
      styles.innerText += "#".concat(id, "-map {").concat(map.css, "}");
      mapObject.setAttribute('style', map.css);
    } else {
      styles.innerText += "#".concat(id, "-map {\n\t\t\t\theight: 400px;\n\t\t\t\tmargin: 6px auto;\n\t\t\t}");
    }
    questionBody.appendChild(mapObject);

    // Initialize the Google Map
    var googleMap = new google.maps.Map(mapObject, map.options);

    // Initialize the Markers
    map.markers.forEach(function (marker, index) {
      // Create the marker
      var mapMarker = new google.maps.Marker(_objectSpread(_objectSpread({}, marker.options), {}, {
        map: googleMap,
        position: map.options.center
      }));
      if (marker.autocomplete.enabled) {
        var inputId = "".concat(id, "-").concat(index, "-locationInput");

        // Make the label for the autocomplete
        var locationLabel = document.createElement('label');
        locationLabel.setAttribute('for', inputId);
        locationLabel.setAttribute('id', "".concat(inputId, "-label"));
        locationLabel.setAttribute('class', 'QuestionText');
        if (marker.autocomplete.labelCss) {
          styles.innerText += "#".concat(inputId, "-label {").concat(marker.autocomplete.labelCss, "}");
        }
        locationLabel.innerText = marker.autocomplete.label || marker.options.title || "Marker ".concat(marker.options.label ? marker.options.label : index);
        questionBody.appendChild(locationLabel);

        // Make the autocomplete
        var locationInput = document.createElement('input');
        locationInput.setAttribute('id', inputId);
        locationInput.setAttribute('class', 'InputText');
        if (marker.autocomplete.css) {
          styles.innerText += "#".concat(id, "-").concat(index, "-locationInput {").concat(marker.autocomplete.css, "}");
        }
        questionBody.appendChild(locationInput);

        // Load the places API
        var locationAutocomplete = new google.maps.places.Autocomplete(locationInput);

        // Whenever the input changes, set the locationLatLong and pan the map to the location
        google.maps.event.addListener(locationAutocomplete, 'place_changed', function () {
          var place = locationAutocomplete.getPlace();
          if (place.geometry) {
            mapMarker.setPosition(place.geometry.location);
            googleMap.panTo(place.geometry.location);
            if (googleMap.zoom >= PREFERRED_ZOOM) {
              setLatLng(place.geometry.location);
            } else {
              googleMap.setZoom(PREFERRED_ZOOM);
            }
          } else {
            alert(marker.autocomplete.invalidLocationAlertText || 'Invalid Location');
          }
        });
      }

      // When the map is clicked, move the marker and update stored position
      google.maps.event.addListener(googleMap, 'click', function (event) {
        if (googleMap.zoom < PREFERRED_ZOOM) {
          googleMap.setZoom(PREFERRED_ZOOM);
        }
        setLatLng(event.latLng);
        mapMarker.setPosition(event.latLng);
        googleMap.panTo(event.latLng);
      });

      // When the marker is dragged, store the lat/lng where it ends
      google.maps.event.addListener(mapMarker, 'dragend', function (event) {
        if (googleMap.zoom < PREFERRED_ZOOM) {
          googleMap.setZoom(PREFERRED_ZOOM);
        }
        setLatLng(event.latLng);
        googleMap.panTo(event.latLng);
      });
    });
  }

  // Invoking initMap function
  initMap(this.questionId, this.getQuestionContainer(), {
    // Map Options, set these! See Map Options in Option Documentation Section
    options: {
      center: PORTLAND_CENTER,
      restriction: {
        latLngBounds: PORTLAND_URBAN_BOUNDS,
        strictBounds: true
      },
      zoom: PREFERRED_ZOOM
    },
    // Marker Options, set these!
    markers: [
    // First Marker
    {
      // See Marker Options in Option Documentation Section
      options: {
        title: "Marker",
        draggable: true,
        label: ""
      },
      autocomplete: {
        // If true, an autocomplete will show.
        enabled: true,
        css: "padding: 4px; font-size: 16px; border: 1px solid black; margin: 4px 0;",
        // The label shown for the autocomplete field
        label: "Search for an address:",
        // Styles for the label
        labelCss: "margin: 4px auto; font-size: 16px; border: none; padding: 0;",
        // Text to show if an invalid location is selected
        invalidLocationAlertText: "Please choose a location from the search dropdown. If your location doesn't appear in the search, enter a nearby location and move the marker to the correct location."
      }
    }
    // You can add more markers as well
    ]
  });
});

// Other Qualtrics functions to use if needed:

// Qualtrics.SurveyEngine.addOnReady(function() {
// 	/* Place your Javascript here to run when the page is ready */
// });
//
// Qualtrics.SurveyEngine.addOnUnload(function() {
// 	/*Place your JavaScript here to run when the page is unloaded*/
//
// });
