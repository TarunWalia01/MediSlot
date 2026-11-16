import Service from '../models/Service.js';
import { escapeRegex, getListOptions } from '../utils/listQuery.js';

const allowedFields = ['name', 'description', 'fee', 'duration', 'isActive'];
const requiredFields = ['name', 'fee', 'duration'];

export async function getServices(request, response) {
  const includeInactive = request.query.includeInactive === 'true';
  if (includeInactive && request.user?.role !== 'admin') {
    return response.status(403).json({
      success: false,
      message: 'Only administrators can view inactive services.'
    });
  }

  const options = getListOptions(request.query, ['name', 'fee', 'duration', 'createdAt']);
  if (options.error) {
    return response.status(400).json({ success: false, message: options.error });
  }

  const filters = includeInactive ? {} : { isActive: true };
  if (request.query.search !== undefined) {
    if (typeof request.query.search !== 'string') {
      return response.status(400).json({
        success: false,
        message: 'Search must be a single string value.'
      });
    }

    const search = request.query.search.trim();
    if (search) {
      if (search.length > 100) {
        return response.status(400).json({
          success: false,
          message: 'Search cannot be longer than 100 characters.'
        });
      }

      const searchPattern = new RegExp(escapeRegex(search), 'i');
      filters.$or = [
        { name: searchPattern },
        { description: searchPattern }
      ];
    }
  }

  const minFee = parseOptionalFee(request.query.minFee, 'minFee');
  const maxFee = parseOptionalFee(request.query.maxFee, 'maxFee');
  if (minFee.error || maxFee.error) {
    return response.status(400).json({
      success: false,
      message: minFee.error || maxFee.error
    });
  }

  if (minFee.value !== undefined || maxFee.value !== undefined) {
    filters.fee = {};
    if (minFee.value !== undefined) {
      filters.fee.$gte = minFee.value;
    }
    if (maxFee.value !== undefined) {
      filters.fee.$lte = maxFee.value;
    }
    if (
      minFee.value !== undefined
      && maxFee.value !== undefined
      && minFee.value > maxFee.value
    ) {
      return response.status(400).json({
        success: false,
        message: 'minFee cannot be greater than maxFee.'
      });
    }
  }

  try {
    const [services, total] = await Promise.all([
      Service.find(filters)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      Service.countDocuments(filters)
    ]);

    return response.json({
      success: true,
      data: services,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    return handleServiceError(error, response);
  }
}

export async function getServiceById(request, response) {
  if (!isObjectId(request.params.id)) {
    return response.status(400).json({
      success: false,
      message: 'Service ID is invalid.'
    });
  }

  const wantsInactive = request.query.includeInactive === 'true';
  if (wantsInactive && request.user?.role !== 'admin') {
    return response.status(403).json({
      success: false,
      message: 'Only administrators can view inactive services.'
    });
  }

  const includeInactive = wantsInactive;
  const filters = { _id: request.params.id };
  if (!includeInactive) {
    filters.isActive = true;
  }

  try {
    const service = await Service.findOne(filters);
    if (!service) {
      return response.status(404).json({
        success: false,
        message: 'Service not found.'
      });
    }

    return response.json({ success: true, data: service });
  } catch (error) {
    return handleServiceError(error, response);
  }
}

export async function createService(request, response) {
  const result = getServiceInput(request.body, false);
  if (result.error) {
    return response.status(400).json({ success: false, message: result.error });
  }

  try {
    const service = await Service.create(result.data);
    return response.status(201).json({
      success: true,
      message: 'Service created successfully.',
      data: service
    });
  } catch (error) {
    return handleServiceError(error, response);
  }
}

export async function updateService(request, response) {
  if (!isObjectId(request.params.id)) {
    return response.status(400).json({
      success: false,
      message: 'Service ID is invalid.'
    });
  }

  const result = getServiceInput(request.body, true);
  if (result.error) {
    return response.status(400).json({ success: false, message: result.error });
  }

  if (Object.keys(result.data).length === 0) {
    return response.status(400).json({
      success: false,
      message: 'Provide at least one service field to update.'
    });
  }

  try {
    const service = await Service.findByIdAndUpdate(request.params.id, result.data, {
      new: true,
      runValidators: true
    });

    if (!service) {
      return response.status(404).json({
        success: false,
        message: 'Service not found.'
      });
    }

    return response.json({
      success: true,
      message: 'Service updated successfully.',
      data: service
    });
  } catch (error) {
    return handleServiceError(error, response);
  }
}

export async function deactivateService(request, response) {
  if (!isObjectId(request.params.id)) {
    return response.status(400).json({
      success: false,
      message: 'Service ID is invalid.'
    });
  }

  try {
    const service = await Service.findByIdAndUpdate(
      request.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    );

    if (!service) {
      return response.status(404).json({
        success: false,
        message: 'Service not found.'
      });
    }

    return response.json({
      success: true,
      message: 'Service deactivated successfully.',
      data: service
    });
  } catch (error) {
    return handleServiceError(error, response);
  }
}

function getServiceInput(body, isPartial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unknownField) {
    return { error: `Unsupported service field: ${unknownField}.` };
  }

  if (!isPartial) {
    const missingField = requiredFields.find(
      (field) => body[field] === undefined || body[field] === null
    );
    if (missingField) {
      return { error: `${missingField} is required.` };
    }
  }

  const data = {};
  for (const field of ['name', 'description']) {
    if (body[field] === undefined) {
      continue;
    }

    if (typeof body[field] !== 'string') {
      return { error: `${field} must be a string.` };
    }

    data[field] = body[field].trim();
    if (field === 'name' && data.name.length < 2) {
      return { error: 'Service name must be at least 2 characters long.' };
    }
  }

  if (data.name && data.name.length > 100) {
    return { error: 'Service name cannot be longer than 100 characters.' };
  }

  if (data.description && data.description.length > 1000) {
    return { error: 'Service description cannot be longer than 1000 characters.' };
  }

  if (body.fee !== undefined) {
    if (typeof body.fee !== 'number' || !Number.isFinite(body.fee) || body.fee < 0) {
      return { error: 'Fee must be a non-negative number.' };
    }
    data.fee = body.fee;
  }

  if (body.duration !== undefined) {
    if (
      typeof body.duration !== 'number'
      || !Number.isInteger(body.duration)
      || body.duration < 5
      || body.duration > 480
    ) {
      return { error: 'Duration must be a whole number between 5 and 480 minutes.' };
    }
    data.duration = body.duration;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return { error: 'isActive must be true or false.' };
    }
    data.isActive = body.isActive;
  }

  return { data };
}

function parseOptionalFee(value, fieldName) {
  if (value === undefined) {
    return {};
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return { error: `${fieldName} must be a non-negative number.` };
  }

  const fee = Number(value);
  if (!Number.isFinite(fee) || fee < 0) {
    return { error: `${fieldName} must be a non-negative number.` };
  }

  return { value: fee };
}

function isObjectId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function handleServiceError(error, response) {
  if (error.code === 11000) {
    return response.status(409).json({
      success: false,
      message: 'A service with this name already exists.'
    });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return response.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('Service request failed:', error.message);
  return response.status(500).json({
    success: false,
    message: 'Unable to complete the service request right now.'
  });
}
