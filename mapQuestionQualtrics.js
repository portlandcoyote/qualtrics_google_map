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

Qualtrics.SurveyEngine.addOnload(function() {

	const PREFERRED_ZOOM = 18;

	// lat long object of map center on load
	const PORTLAND_CENTER = {
		lat: 45.5160179,
		lng: -122.681427,
	};

	// lat long object of boundary restriction for map
	const PORTLAND_URBAN_BOUNDS = {
		north: 46.5,
		south: 44.75,
		west: -124.0,
		east: -121.5,
	};

	// Inputs: The qualtrics survey quetion-id, question-container, and the google map instance
	// Outputs: Append a google map instance inside a qualtrics survey question through dom manipulation
	function initMap(id, container, map) {
		const dataBox = document.getElementById(`QR~${id}`);
		if (!dataBox) {
			return new Error(`Could not find input for question with id ${id}.`);
		}

		dataBox.style.display = 'none';

		// Find the QuestionBody to append to
		const questionBody = container.querySelector('.QuestionBody') || container;

		// Function to set the dataBox to a lat/lng
		function setLatLng(latLng) {
			dataBox.value = JSON.stringify(latLng);
		}

		const styles = document.createElement('style');
		document.head.appendChild(styles);

		// Create the map node
		const mapObject = document.createElement('div');
		mapObject.setAttribute('id', `${id}-map`);

		if (map.css) {
			styles.innerText += `#${id}-map {${map.css}}`;
			mapObject.setAttribute('style', map.css);
		} else {
			styles.innerText += `#${id}-map {
				height: 400px;
				margin: 6px auto;
			}`;
		}

		questionBody.appendChild(mapObject);

		// Initialize the Google Map
		const googleMap = new google.maps.Map(mapObject, map.options);

		// Initialize the Markers
		map.markers.forEach((marker, index) => {
			// Create the marker
			const mapMarker = new google.maps.Marker({
				...marker.options,
				map: googleMap,
				position: map.options.center,
			});

			if (marker.autocomplete.enabled) {
				const inputId = `${id}-${index}-locationInput`;

				// Make the label for the autocomplete
				const locationLabel = document.createElement('label');
				locationLabel.setAttribute('for', inputId);
				locationLabel.setAttribute('id', `${inputId}-label`);
				locationLabel.setAttribute('class', 'QuestionText');
				if (marker.autocomplete.labelCss) {
					styles.innerText += `#${inputId}-label {${marker.autocomplete.labelCss}}`;
				}
				locationLabel.innerText = marker.autocomplete.label || marker.options.title || `Marker ${marker.options.label ? marker.options.label : index}`;
				questionBody.appendChild(locationLabel);

				// Make the autocomplete
				const locationInput = document.createElement('input');
				locationInput.setAttribute('id', inputId);
				locationInput.setAttribute('class', 'InputText');
				if (marker.autocomplete.css) {
					styles.innerText += `#${id}-${index}-locationInput {${marker.autocomplete.css}}`;
				}
				questionBody.appendChild(locationInput);

				// Load the places API
				const locationAutocomplete = new google.maps.places.Autocomplete(locationInput);

				// Whenever the input changes, set the locationLatLong and pan the map to the location
				google.maps.event.addListener(locationAutocomplete, 'place_changed', () => {

					const place = locationAutocomplete.getPlace();

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
			google.maps.event.addListener(googleMap, 'click', event => {
				if (googleMap.zoom < PREFERRED_ZOOM) {
					googleMap.setZoom(PREFERRED_ZOOM);
				}

				setLatLng(event.latLng);
				mapMarker.setPosition(event.latLng);
				googleMap.panTo(event.latLng);
			});


			// When the marker is dragged, store the lat/lng where it ends
			google.maps.event.addListener(mapMarker, 'dragend', event => {
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
				strictBounds: true,
			},
			zoom: PREFERRED_ZOOM,
		},
		// Marker Options, set these!
		markers: [
			// First Marker
			{
				// See Marker Options in Option Documentation Section
				options: {
					title: "Marker",
					draggable: true,
					label: "",
				},
				autocomplete: {
					// If true, an autocomplete will show.
					enabled: true,
					css: "padding: 4px; font-size: 16px; border: 1px solid black; margin: 4px 0;",
					// The label shown for the autocomplete field
					label: "Search for an address:",
					// Styles for the label
					labelCss: "margin: 4px auto; font-size: 16px; border: none",
					// Text to show if an invalid location is selected
					invalidLocationAlertText:
						"Please choose a location from the search dropdown. If your location doesn't appear in the search, enter a nearby location and move the marker to the correct location.",
				},
			},
			// You can add more markers as well
		],
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
