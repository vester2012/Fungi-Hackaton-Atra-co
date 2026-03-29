import React from 'react';

export default function MainMenu({
                                     onStartGame,
                                     onCreateRoom,
                                     onJoinRoom,
                                     onMatchmaking,
                                     onChangeColor,
                                     colorLabel
                                 }) {
    return (
        <div className="menu-screen">
            <div className="menu-card">
                <div className="menu-title">
                    <span className="menu-title-mad">MAD</span>
                    <span className="menu-title-animals">ANIMALS</span>
                </div>

                <div className="menu-subtitle">Fungi Hackaton</div>
                <div className="menu-section-title">Main menu</div>

                <div className="menu-buttons">
                    <button className="menu-btn menu-btn-primary" onClick={onStartGame}>
                        Start Game
                    </button>

                    <button className="menu-btn" onClick={onCreateRoom}>
                        Create room
                    </button>

                    <button className="menu-btn" onClick={onJoinRoom}>
                        join room by id
                    </button>

                    <button className="menu-btn" onClick={onMatchmaking}>
                        🥇 MATCHMAKING 🥇
                    </button>

                    <button className="menu-btn menu-btn-color" onClick={onChangeColor}>
                        {colorLabel}
                    </button>
                </div>

                <div className="menu-status">Choose an action</div>
            </div>
        </div>
    );
}