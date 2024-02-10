import {Schema} from 'mongoose';

export interface IGameMatch {
  wallet: string;
  warcatTokenId: number;
  searchTime: number;
}

export const gameMatchSchema = new Schema({
  wallet: {type: String, required: true},
  warcatTokenId: {type: Number, required: true, unique: true},
  searchTime: {type: Number, required: true},
});
