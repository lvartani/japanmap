

var prefecture;

var markerCluster;

//style for markerCluster
var styles = [[{
	url: 'images/multiphoto.png',
	height: 99,
	width: 100,
	anchor: [18, 0],
	textColor: '#ff0000',
	textSize: 24
}]];
	  
var markers = [];
var map;
var feed;
var photocluster;
var currentmarkercount = -1;
var sv = new google.maps.StreetViewService();
var panorama;

var albumids = [];
albumids.push('6016477758720378897'); //Loosine Album Test
/*
albumids.push('5686596568258591026'); //2011-12-09 Fukushima Yugo
albumids.push('5767629723248639201'); //2011-07-18 Fukushima Bishamon
albumids.push('5779236767652641665'); //2011-07-18 Fukushima Bishamon
*/


var defaultalbumid = 1;

function initialize() 
{
	
	//if id is passed in url, use that one	
	var id = $.getUrlVar('id');
	if(typeof id == 'undefined')
	{
		albumid = albumids[defaultalbumid]; //default album
	}
	else
	{
		albumid = albumids[id];
		defaultalbumid = id;
	}
	
	showintro();
		
	var center = new google.maps.LatLng(37.4419, -122.1419);

	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 3,
		center: center,
		mapTypeId: google.maps.MapTypeId.HYBRID,
		mapTypeControl: true,
		mapTypeControlOptions: {
		  style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		},
		zoomControl: true,
		zoomControlOptions: {
		  style: google.maps.ZoomControlStyle.SMALL,
		  position: google.maps.ControlPosition.RIGHT_CENTER
		},
		panControl:false,
		panControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
    },
	});
	
	 google.maps.event.addListener(map, 'click', function(event) {
      sv.getPanoramaByLocation(event.latLng, 50, processSVData);
  });
  				//https://picasaweb.google.com/116290092079033599191/20140331185045?authuser=0&feat=directlink
  					
	$.getJSON('https://picasaweb.google.com/data/feed/api/user/116290092079033599191/albumid/' +albumids+ '?alt=json&fields=entry&callback=?',function(data){
		console.log(data);
		
		
		var counter = 0;
		feed=data;
		$.each(data.feed.entry, function(i,val){
			if(typeof val.georss$where !== "undefined")
			{
				var coords = val.georss$where.gml$Point.gml$pos.$t;
				var splitcoords = coords.split(' ');
				var lat = splitcoords[0];
				var lng = splitcoords[1];
				var latLng = new google.maps.LatLng(lat,lng);
				var picasaurl = val.link[1].href;
				var summary = val.summary.$t;
				
				//create photo icon
				var photoicon = new google.maps.MarkerImage(
					val.media$group.media$thumbnail[0].url,
					null, /* size is determined at runtime */
					null, /* origin is 0,0 */
				   	new google.maps.Point(26,47), /* anchor is bottom center of the scaled image */
					new google.maps.Size(52, 39)
				);  
				
				var photoshadow = new google.maps.MarkerImage(
					'images/singlephotoshadow.png',
					null, /* size is determined at runtime */
					null, /* origin is 0,0 */
				   	null, /* anchor is bottom center of the scaled image */
					new google.maps.Size(65, 56)
				);  
				
				//create marker
				var marker = new google.maps.Marker(
				{
					count: counter,
					position: latLng,
					icon:photoicon,
					thumbnail: val.media$group.media$thumbnail[0].url,
					photourl: val.media$group.media$content[0].url,
					shadow: photoshadow,
					picasaurl: picasaurl,
					summary: summary,
					width: val.gphoto$width.$t,
					height: val.gphoto$height.$t,
					val: val
				});
				markers.push(marker);
				
				//click event for individual photo's
				google.maps.event.addListener(marker, "click", function (c) {
					var photourl = marker.photourl;
					showPhotoInLightbox(marker.count);
					 sv.getPanoramaByLocation(event.latLng, 50, processSVData);
				});
				
				//add to slides
				$('#slides').append('<img onclick="zoom2marker('+(marker.count-1)+')" style="cursor:pointer;margin:5px;border:4px solid white;" src="'+val.media$group.media$thumbnail[0].url+'">');
				
				counter++;
			}
		});
		markerCluster = new MarkerClusterer(map, markers,{
			styles: styles[0],
			zoomOnClick: true,
			gridSize: 40,
			maxZoom: 18
		});

		//click event for photo cluster
/*
		google.maps.event.addListener(markerCluster, "click", function (c) {
			photocluster = c;
			showPhotoClusterInLightbox(c);
		});
*/

		markerCluster.fitMapToMarkers();
	});
	centerlightbox();

	var photoid = $.getUrlVar('photoid');
	if(typeof photoid !== 'undefined')
	{
		setTimeout('zoom2marker('+photoid+')',1000)
	}
		
	$('#slides').hover(function(){
		$('#slides').animate({height:300});
	},
	function(){
		$('#slides').animate({height:120});
	});

	//keyboard navigation
	$().ready(function() {	
		$(document.documentElement).keyup(function (event) {
			// handle cursor keys
			if (event.keyCode == 37) {
			  // go left	
				zoom2marker(currentmarkercount-1);
			} else if (event.keyCode == 39) {
			  // go right
				zoom2marker(currentmarkercount+1);
			}						
		});
	});


prefecture = new google.maps.KmlLayer('http://sandbox.idre.ucla.edu/up206b/2014/loosine/code/images/prefecture1.kml',{ preserveViewport: true });
prefecture.setMap(map);

 panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'));

$( "#hider" ).click(function() {
  $( "#uppercube" ).hide( "slow" );
});
}

$(function() {
    $( "#pano" ).resizable();
  });

function showPhotoInLightbox(id)
{
	currentmarkercount=(id-1);

	//determine if landscape or portrait
	if(markers[id].width > markers[id].height)
	{
		var photowidth = 492;
		var photoright = 15;
	}
	else
	{
		var photowidth = 320;
		var photoright = 15;
	}
	
	var buttonright = 6;
	//$('#fullscreen').fadeIn();
	$('#lightbox').fadeIn();
	$('#lightbox').html('<div style="text-align:center;"><img class="photo" style="display:none;" src="'+markers[id].photourl+'" onclick="zoom2marker('+id+')"><div id="prev" style="display:none;text-align:center;position:absolute;top:155;left:0;cursor: pointer; padding:10px;" onclick="zoom2marker('+(id-2)+')"><img src="images/prev.png"></div><div id="next" style="display:none;text-align:center;position:absolute;top:155;right:0;cursor: pointer; padding:10px;" onclick="zoom2marker('+id+')"><img src="images/next.png"></div><div id="close" style="text-align:center;position:absolute;top:6;right:'+buttonright+';cursor: pointer; padding:10px;" onclick="$(\'#lightbox\').fadeOut()"><img src="images/close.png" style="opacity:0.3; padding:5px; background:white;"></div><div id="picasa" style="text-align:center;position:absolute;top:6;right:'+(buttonright+45)+';cursor: pointer; padding:10px;"><a href="'+markers[id].picasaurl+'" target="_blank"><img src="images/picasa.png" style="opacity:0.3; padding:5px; background:white;" border="0"></a></div><div id="drag" style="text-align:center;position:absolute;top:6;right:'+(buttonright+90)+';cursor: pointer; padding:10px;"><img src="images/drag.png" style="opacity:0.3; padding:5px; background:white;"></div><div id="summary" style="background:black;color:white;opacity:0.8;text-align:center;position:absolute;bottom:15;right:'+photoright+';width:'+photowidth+';cursor: pointer; padding:10px;">'+markers[id].summary+'</div></div>');
	$('#lightbox').hover(function(){
		$('#prev').fadeIn();
		$('#next').fadeIn();
		$('#drag').fadeIn();
		$('#picasa').fadeIn();
		$('#close').fadeIn();
		$('#summary').fadeIn();
	},
	function(){
		$('#prev').fadeOut();
		$('#next').fadeOut();
		$('#drag').fadeOut();
		$('#picasa').fadeOut();
		$('#close').fadeOut();
		$('#summary').fadeOut();
	}
	);
//	$('#lightbox').append('<div style="float:left;text-align:center;padding:20px;" onclick="zoom2marker('+id+')">next</div>');


	$('.photo').fadeIn('slow');
}

function zoom2marker(id)
{
	$('#introbox').fadeOut();
	$('#fullscreen').fadeOut();
	
	currentmarkercount=id;
	map.setZoom(18);
	map.panTo(markers[id+1].getPosition());
	google.maps.event.trigger(markers[id+1], 'click')
}

function showPhotoClusterInLightbox(c)
{
	if(typeof c === undefined)
	{
		thiscluster = c;
	}
	else
	{
		thiscluster = photocluster;
	}
	
	var photohtml =  '';
	$.each(thiscluster.markers_,function(i,val){
		photohtml += '<img class="thumbnail" src="'+val.thumbnail+'" onclick="showPhotoInLightbox(\''+val.photourl+'\')">';
	});
	//$('#fullscreen').fadeIn();
	$('#lightbox').fadeIn();
	$('#lightbox').html('<div style="text-align:center;padding:20px;">'+photohtml+'</div>');
}

function centerlightbox()
{
	var h = $(window).height();
	var top = -((h - 600)/2+600);
//	$('#lightbox').css('top',top);
//	$('#lightbox').css('right',100);
	$('#introbox').css('top',top);
	$('#fullscreen').click(function() {
		$('#lightbox').fadeOut();
		$('#fullscreen').fadeOut();
	});	
}

function showintro()
{

	$('#fullscreen').fadeIn();
	var h = $(window).height();
	var top = -((h - 400)/2+400);
	$('#introbox').css('top',top);

	$('#introbox').fadeIn();

	$('#fullscreen').click(function() {
		$('#introbox').fadeOut();
		$('#fullscreen').fadeOut();
	});	
	
		var html = '<div style="float:left; padding:10px; width:300px; clear:both"> \
                <img src="http://sandbox.idre.ucla.edu/up206b/2014/loosine/code/images/logo4.png" style="width:575px; height:310;"> \
            </div> \
            <div style="float:left; padding:10px; width:300px;> \
            </div>';
	

	$('#introcontent').html(html);
	
}

//toggle single layers on/off
function toggleLayer(layer,id)
{
    if ($('#'+id).is(':checked'))
    {
        layer.setMap(map);
    }
    else
    {
        layer.setMap(null);
    }
}

function processSVData(data, status) {
  if (status == google.maps.StreetViewStatus.OK) {
   

    panorama.setPano(data.location.pano);
    panorama.setPov({
      heading: 270,
      pitch: 0
    });
    panorama.setVisible(true);

    google.maps.event.addListener(marker, 'click', function() {

      var markerPanoID = data.location.pano;
      // Set the Pano to use the passed panoID
      panorama.setPano(markerPanoID);
      panorama.setPov({
        heading: 270,
        pitch: 0
      });
      panorama.setVisible(true);
    });
  } else {
    alert('Click somewhere else to get streetview on the leftside panel.');
  }
}

google.maps.event.addDomListener(window, 'load', initialize);

