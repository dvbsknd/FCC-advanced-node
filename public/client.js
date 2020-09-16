// We're using JQuery, which will need to be included
// in the document somewhere
$(document).ready(function () {

  // Establish a connection with  socket.io,
  // which will also need to be available on the page
  /*global io*/
  let socket = io();
  socket.on('user count', function(data) {
    console.log(data);
  });

  // Submit the form with contents of element '#m'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    // TODO: sending the message via the socket
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

});
