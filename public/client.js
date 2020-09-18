// We're using JQuery, which will need to be included
// in the document somewhere
$(document).ready(function () {

  // Establish a connection with  socket.io,
  // which will also need to be available on the page
  /*global io*/
  let socket = io();

  // Handle new users joining
  socket.on('user', function(data) {
    const { name, connected, currentUsers: users } = data;
    $('#num-users').text(`${users} users online`);
    const message = `${name} has ${connected ? 'joined' : 'left'} the chat`;
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });

  // Handle incoming messages
  socket.on('chat message', message => {
    const { content, user } = message;
    $('#messages').append($('<li>').html(user + ': ' + content));
  });

  // Submit the form with contents of element '#m'
  $('form').submit(function () {
    var message = $('#m').val();
    socket.emit('chat message', message);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

});
