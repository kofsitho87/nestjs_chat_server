import { CardButtonAction, MessageCardType } from '@/enums/enums';
import { Prop, Schema } from '@nestjs/mongoose';

@Schema({
  versionKey: false,
  _id: false,
})
class CardLink {
  @Prop({ required: true, type: String })
  sid!: string;

  @Prop({ required: true, type: String })
  name!: string;

  @Prop({ required: false, type: String, default: null })
  profileUrl?: string;
}

@Schema({
  versionKey: false,
  _id: false,
})
class CardButton {
  @Prop({ required: true, type: String })
  title!: string;

  @Prop({ required: true, type: String, enum: CardButtonAction })
  action!: CardButtonAction;

  @Prop({ required: false, type: Object, default: null })
  value?: Record<string, any>;
}

@Schema({
  versionKey: false,
  _id: false,
})
export class CardData {
  @Prop({ required: true, type: String, enum: MessageCardType })
  cardType!: MessageCardType;

  @Prop({ required: false, type: String, default: null })
  text?: string;

  @Prop({ required: false, type: CardLink, default: null })
  link?: CardLink;

  @Prop({ required: false, type: Boolean, default: null })
  acceptedStatus?: boolean;

  @Prop({ required: false, type: String, default: null })
  image?: string;

  @Prop([CardButton])
  buttons?: CardButton[];

  @Prop({ required: false, type: String, default: null })
  productApplicationId?: string;
}
