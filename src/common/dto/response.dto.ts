export class ResponseDto<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data?: T,
    meta?: any,
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(
    message: string = 'Success',
    data?: T,
    statusCode: number = 200,
  ): ResponseDto<T> {
    return new ResponseDto<T>(true, statusCode, message, data);
  }

  static created<T>(message: string = 'Created', data?: T): ResponseDto<T> {
    return new ResponseDto<T>(true, 201, message, data);
  }

  static paginated<T>(
    message: string = 'Success',
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): ResponseDto<T[]> {
    return new ResponseDto<T[]>(true, 200, message, data, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  }
}