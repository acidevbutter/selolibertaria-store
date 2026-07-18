export const ADMIN_IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const ADMIN_IMAGE_UPLOAD_MAX_LABEL = "5 MB";
export const ADMIN_IMAGE_UPLOAD_TOO_LARGE_MESSAGE = `A imagem deve ter no máximo ${ADMIN_IMAGE_UPLOAD_MAX_LABEL}.`;
export const ADMIN_IMAGE_UPLOAD_INVALID_TYPE_MESSAGE = "Envie apenas arquivos de imagem.";

export function getAdminImageUploadError(file: File) {
	if (!file.type.startsWith("image/")) {
		return ADMIN_IMAGE_UPLOAD_INVALID_TYPE_MESSAGE;
	}

	if (file.size > ADMIN_IMAGE_UPLOAD_MAX_BYTES) {
		return ADMIN_IMAGE_UPLOAD_TOO_LARGE_MESSAGE;
	}

	return null;
}

export function assertAdminImageUploadFile(file: File) {
	const error = getAdminImageUploadError(file);

	if (error) {
		throw new Error(error);
	}
}
