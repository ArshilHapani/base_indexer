#!/bin/bash

# Create a new session named 'defi_backend'
tmux new-session -d -s defi_backend -n server

# Create the first window (server, prisma studio, worker)
tmux send-keys -t defi_backend:server 'make start-server' C-m
tmux split-window -v -t defi_backend:server
tmux send-keys -t defi_backend:server.1 'bunx prisma studio' C-m
tmux split-window -h -t defi_backend:server.1
tmux send-keys -t defi_backend:server.2 'make worker-tokenConsumer' C-m

# Set layout (one horizontal with two vertical below)
tmux select-layout -t defi_backend:server main-horizontal

# Rename the panes for clarity
tmux select-pane -T 'Server Pane' -t defi_backend:server.0
tmux select-pane -T 'Prisma Studio Pane' -t defi_backend:server.1
tmux select-pane -T 'Worker Pane' -t defi_backend:server.2

# Create a second window for general working
tmux new-window -t defi_backend -n working

# Attach to the session 
tmux attach -t defi_backend
