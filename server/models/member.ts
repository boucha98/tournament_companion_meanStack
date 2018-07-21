import * as mongoose from 'mongoose';
import { ITournament } from './tournament';

let Schema = mongoose.Schema;

export interface IMember extends mongoose.Document {
    pseudo: string;
    password: string;
    profile: string;
    birthdate: string;
    admin: boolean;
    addresses: mongoose.Types.Array<IAddress>;
    tournaments: mongoose.Types.Array<ITournament>;
}

export interface IAddress extends mongoose.Document {
    street_addr: string;
    postal_code: string;
    localization: string;
    member: IMember;
}

let addressSchema = new mongoose.Schema({
    street_addr: { type: String, required: true },
    postal_code: { type: String, required: true },
    localization: { type: String, required: true },
    member: { type: Schema.Types.ObjectId, ref: 'Member' }
});

let memberSchema = new mongoose.Schema({
    pseudo: { type: String, required: true, unique: true },
    password: { type: String, default: '' },
    profile: { type: String, default: '' },
    birthdate: { type: Date },
    admin: { type: Boolean, default: false },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
    tournaments: [{ type: Schema.Types.ObjectId, ref: 'Tournament' }],
});

export let Member = mongoose.model<IMember>('Member', memberSchema);
export let Address = mongoose.model<IAddress>('Address', addressSchema);

export default Member;
