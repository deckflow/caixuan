import { parseBoolean, parseInteger, parseNullableJson } from './parse.js';

export type ShareModifyCliOptions = {
  name?: string;
  description?: string;
  isSecrecy?: string;
  noticeUserId?: string[];
  consumerTag?: number[];
  needPhone?: 'yes' | 'no';
  singleLinkViewLimit?: string;
  password?: string;
  download?: string;
  allowViewerShare?: 'yes' | 'no';
  allowSearchEngineIndex?: 'yes' | 'no';
  watermark?: string;
  fileWatermark?: string;
  watermarkColor?: string;
  expiredAt?: string;
  allowLeaveContact?: 'yes' | 'no';
  contactType?: string;
  viewControl?: string;
  price?: string;
  paidInterval?: string;
  publicBuyerAndMessage?: 'yes' | 'no';
  content?: string;
  doc?: string[];
  overseasCdn?: 'yes' | 'no';
};

export function buildShareModifyPayload(options: ShareModifyCliOptions): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (options.name !== undefined) payload.name = options.name;
  if (options.description !== undefined) payload.description = options.description;
  if (options.isSecrecy !== undefined) payload.isSecrecy = parseBoolean(options.isSecrecy, '--is-secrecy');
  if (options.noticeUserId && options.noticeUserId.length > 0) payload.noticeUserIds = options.noticeUserId;
  if (options.consumerTag && options.consumerTag.length > 0) payload.consumerTags = options.consumerTag;
  if (options.needPhone !== undefined) payload.needPhone = options.needPhone;
  if (options.singleLinkViewLimit !== undefined) {
    payload.singleLinkViewLimit = parseInteger(options.singleLinkViewLimit, '--single-link-view-limit');
  }
  if (options.password !== undefined) payload.password = options.password;
  if (options.download !== undefined) payload.download = options.download;
  if (options.allowViewerShare !== undefined) payload.allowViewerShare = options.allowViewerShare;
  if (options.allowSearchEngineIndex !== undefined) {
    payload.allowSearchEngineIndex = options.allowSearchEngineIndex;
  }
  if (options.watermark !== undefined) payload.watermark = options.watermark;
  if (options.fileWatermark !== undefined) payload.fileWatermark = options.fileWatermark;
  if (options.watermarkColor !== undefined) payload.watermarkColor = options.watermarkColor;
  if (options.expiredAt !== undefined) {
    payload.expiredAt = options.expiredAt === 'null' ? null : options.expiredAt;
  }
  if (options.allowLeaveContact !== undefined) payload.allowLeaveContact = options.allowLeaveContact;
  if (options.contactType !== undefined) payload.contactType = options.contactType;
  if (options.viewControl !== undefined) payload.viewControl = options.viewControl;
  if (options.price !== undefined) payload.price = parseInteger(options.price, '--price');
  if (options.paidInterval !== undefined) {
    payload.paidInterval = parseNullableJson(options.paidInterval, '--paid-interval');
  }
  if (options.publicBuyerAndMessage !== undefined) {
    payload.publicBuyerAndMessage = options.publicBuyerAndMessage;
  }
  if (options.overseasCdn !== undefined) payload.overseasCDN = options.overseasCdn;

  if (options.content !== undefined) {
    payload.content = parseNullableJson(options.content, '--content');
  } else if (options.doc && options.doc.length > 0) {
    payload.content = options.doc.map((id) => ({ _type: 'doc', id }));
  }

  return payload;
}

export function hasShareModifyFields(payload: Record<string, unknown>): boolean {
  return Object.keys(payload).length > 0;
}
