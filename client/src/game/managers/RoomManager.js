import { unit_manager } from "../unit_manager.js";
import { soketJoinRoom } from "./SocketManager.js";

export const RoomManager = {
    joinToRoom: function (roomName, password) {
        soketJoinRoom(unit_manager.info.players[unit_manager.my_id], roomName, password);
    }
}
