export type comment = {
    message: string,
    author: string,
    createdAt: Date,
}

export type doc = {
    id: number,
    title: string,
    content: string,
    type: 'pdf'|'docx'|'pptx',
    uploadedAt: Date,
    comments: string[],
    creator: string,
    editorAccessUsers: string[],
}