import {RoomManager} from "../managers/RoomManager";

const Phaser = window.Phaser;

export class CreateRoomScene extends Phaser.Scene {
    constructor() {
        super('CreateRoomScene');
    }

    create() {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#0f172a');

        this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x0b1020, 1);
        this.add.rectangle(width * 0.5, height * 0.5, 900, 560, 0x111827, 0.92);

        this.add.text(width * 0.5, 100, 'Mad Animals', {
            fontFamily: 'JungleAdventurer',
            fontSize: '78px',
            color: '#f8fafc'
        }).setOrigin(0.5);
        this.add.text(width * 0.5, 150, 'Fungi Hackaton', {
            fontFamily: 'JungleAdventurer',
            fontSize: '20px',
            color: '#f8fafc'
        }).setOrigin(0.5);

        this.add.text(width * 0.5, 190, 'Create room for your team', {
            fontFamily: 'JungleAdventurer',
            fontSize: '22px',
            color: '#94a3b8'
        }).setOrigin(0.5);

        const statusText = this.add.text(width * 0.5, height - 110, 'Choose an action', {
            fontFamily: 'JungleAdventurer',
            fontSize: '20px',
            color: '#cbd5e1'
        }).setOrigin(0.5);

        let roomName = null;
        let roomPassword = ''
        this.createMenuButton(width * 0.5, 270 * 1.35, 360, 64, 'enter name', 0x22c55e, () => {
            roomName = prompt("enter room name:");
            //this.scene.start('MainScene');
        });

        this.createMenuButton(width * 0.5, 360 * 1.35, 360, 64, 'enter password', 0x334155, () => {
            //statusText.setText('click button 1');
            roomPassword = prompt("enter room pass:");
        });

        this.createMenuButton(width * 0.5, 360 * 1.35, 360, 64, 'Create room / Enter', 0x334155, () => {
            //statusText.setText('click button 1');
            //this.scene.start('MainScene')
            RoomManager.joinToRoom(roomName, roomPassword);
        });

    }

    createMenuButton(x, y, width, height, label, color, onClick) {
        const button = this.add.rectangle(x, y, width, height, color, 1).setInteractive({ useHandCursor: true });

        const text = this.add.text(x, y, label, {
            fontFamily: 'JungleAdventurer',
            fontSize: '26px',
            color: '#f8fafc'
        }).setOrigin(0.5);

        button.on('pointerover', () => {
            button.setScale(1.03);
        }).on('pointerout', () => {
            button.setScale(1);
        }).on('pointerdown', onClick);

        text.setDepth(1);
    }
}
