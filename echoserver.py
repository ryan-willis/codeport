import socket

HOST = 'localhost'
PORT = 7771

def server_start():
  s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
  s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
  s.bind((HOST, PORT))
  s.listen(5)

  while 1:
    client, addr = s.accept()

    data = client.recv(4096)
    if data:
      print(data.decode('utf-8'))
    else:
      break

server_start()