import React, { useState } from 'react';

export default function RoomModal({ type, onClose, onSubmit }) {
    const [roomName, setRoomName] = useState('');
    const [roomPass, setRoomPass] = useState('');
    const [idRoom, setIdRoom] = useState('');

    const isCreate = type === 'create-room';
    const isJoin = type === 'join-room';

    function handleSubmit(e) {
        e.preventDefault();

        if (isCreate) {
            onSubmit({
                roomName: roomName.trim(),
                roomPass: roomPass.trim()
            });
            return;
        }

        if (isJoin) {
            onSubmit({
                idRoom: idRoom.trim(),
                passRoom: roomPass.trim()
            });
        }
    }

    return (
        <div className="modal-backdrop">
            <form className="modal-window" onSubmit={handleSubmit}>
                <h2>{isCreate ? 'Create room' : 'Join room'}</h2>

                {isCreate && (
                    <>
                        <input
                            type="text"
                            placeholder="Room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Room password"
                            value={roomPass}
                            onChange={(e) => setRoomPass(e.target.value)}
                        />
                    </>
                )}

                {isJoin && (
                    <>
                        <input
                            type="text"
                            placeholder="Room ID"
                            value={idRoom}
                            onChange={(e) => setIdRoom(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Room password"
                            value={roomPass}
                            onChange={(e) => setRoomPass(e.target.value)}
                        />
                    </>
                )}

                <div className="modal-actions">
                    <button type="submit">Confirm</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </div>
            </form>
        </div>
    );
}