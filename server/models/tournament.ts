import * as mongoose from 'mongoose';
import { IMember } from './member';

let Schema = mongoose.Schema;

export interface ITournament extends mongoose.Document {
	name: string;
	start: string;
	finish: string;
	maxPlayers: number;
    members: mongoose.Types.Array<IMember>;
    games: mongoose.Types.Array<IGame>;
    closed: boolean;
}

export interface IGame extends mongoose.Document {
    game_name: string;
    member1: string;///IMember;
    member2: string;//IMember;
    memb1_score: number;
    memb2_score: number;
    round: number;
    tournament: ITournament;
}

let gameSchema = new mongoose.Schema({
    game_name: { type: String, required: true },
    member1: { type: String, required: true },//{ type: Schema.Types.ObjectId, ref: 'Member' },
    member2: { type: String, required: true },//{ type: Schema.Types.ObjectId, ref: 'Member' },
    memb1_score: { type: Number, required: false },
    memb2_score: { type: Number, required: false },
    round: { type: Number, required: true },
    tournament: { type: Schema.Types.ObjectId, ref: 'Tournament' },
});

let tournamentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique:true},
	start: { type: Date, required: true},
	finish: { type: Date},
	maxPlayers: { type: Number, default: 16},
	members: [{ type: Schema.Types.ObjectId, ref: 'Member'}],
    games: [{ type: Schema.Types.ObjectId, ref: 'Game'}],
    closed: { type: Boolean, default: false, required: true },
});

export let Tournament = mongoose.model<ITournament>('Tournament', tournamentSchema);
export let Game = mongoose.model<IGame>('Game', gameSchema);

export default Tournament;