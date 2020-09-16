// We're using JQuery, which will need to be included
// in the document somewhere
$(document).ready(function () {

  // Submit the form with contents of element '#m'
  $('form').submit(function () {
    var messageToSend = $('#m').val();
    // Send the message using socket.io, which will also need
    // to be available on the page
    /*global io*/
    let socket = io();
    // TODO: sending the message via the socket
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

});
