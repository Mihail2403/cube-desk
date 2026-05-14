import type { components } from '@/shared/api/generated-types';

export type AuthTokenPairResponse = components['schemas']['AuthTokenPairResponse'];
export type AuthLoginRequest = components['schemas']['AuthLoginRequest'];
export type AuthRegisterRequest = components['schemas']['AuthRegisterRequest'];
export type AuthRefreshRequest = components['schemas']['AuthRefreshRequest'];
export type AuthLogoutRequest = components['schemas']['AuthLogoutRequest'];
export type TicketResponse = components['schemas']['TicketResponse'];
export type TicketCreateRequest = components['schemas']['TicketCreateRequest'];
export type TicketUpdateRequest = components['schemas']['TicketUpdateRequest'];
export type TicketCategoryResponse = components['schemas']['TicketCategoryResponse'];
export type TicketCategoryBriefResponse = components['schemas']['TicketCategoryBriefResponse'];
export type TicketCategoryCreateRequest = components['schemas']['TicketCategoryCreateRequest'];
export type TicketCategoryUpdateRequest = components['schemas']['TicketCategoryUpdateRequest'];
export type TicketStatus = components['schemas']['TicketStatus'];
export type TicketPriority = components['schemas']['TicketPriority'];
export type TicketMessageResponse = components['schemas']['TicketMessageResponse'];
export type TicketMessageAttachmentResponse = components['schemas']['TicketMessageAttachmentResponse'];
export type TicketAssigneeResponse = components['schemas']['TicketAssigneeResponse'];
export type TicketAuthorResponse = components['schemas']['TicketAuthorResponse'];
export type SupportUserResponse = components['schemas']['SupportUserResponse'];

/** Роли пользователя (см. FRONTEND_AGENT.md — поле может отсутствовать в openapi.json). */
export type UserRole = 'USER' | 'SUPPORT' | 'ADMIN';

export type UserMeResponse = components['schemas']['UserMeResponse'] & {
  role: UserRole;
};
