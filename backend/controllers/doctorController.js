import mongoose from 'mongoose';
import Doctor from '../models/Doctor.js';
import Service from '../models/Service.js';
import { escapeRegex, getListOptions } from '../utils/listQuery.js';

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;
const objectIdPattern = /^[a-f\d]{24}$/i;
const allowedDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];
const allowedFields = [
  'name',
  'email',
  'phone',
  'specialization',
  'qualification',
  'experience',
  'consultationFee',
  'description',
  'profileImage',
  'services',
  'availableDays',
  'isActive'
];
const requiredFields = [
  'name',
  'email',
  'phone',
  'specialization',
  'qualification',
  'experience',
  'consultationFee'
];
const servicePopulation = 'name description fee duration isActive';

export async function getDoctors(request, response) {
  const includeInactive = request.query.includeInactive === 'true';
  if (includeInactive && request.user?.role !== 'admin') {
    return response.status(403).json({
      success: false,
      message: 'Only administrators can view inactive doctors.'
    });
  }

  const options = getListOptions(
    request.query,
    ['name', 'specialization', 'consultationFee', 'experience', 'createdAt']
  );
  if (options.error) {
    return response.status(400).json({ success: false, message: options.error });
  }

  const filters = includeInactive ? {} : { isActive: true };
  const search = readQueryString(request.query.search, response, 'Search');
  if (search === null) {
    return;
  }

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
      { specialization: searchPattern }
    ];
  }

  const specialization = readQueryString(
    request.query.specialization,
    response,
    'Specialization'
  );
  if (specialization === null) {
    return;
  }

  if (specialization) {
    if (specialization.length > 80) {
      return response.status(400).json({
        success: false,
        message: 'Specialization cannot be longer than 80 characters.'
      });
    }

    filters.specialization = new RegExp(`^${escapeRegex(specialization)}$`, 'i');
  }

  const serviceId = readQueryString(request.query.service, response, 'Service');
  if (serviceId === null) {
    return;
  }

  if (serviceId) {
    if (!objectIdPattern.test(serviceId)) {
      return response.status(400).json({
        success: false,
        message: 'Service must be a valid ID.'
      });
    }

    filters.services = new mongoose.Types.ObjectId(serviceId);
  }

  try {
    const [doctors, total] = await Promise.all([
      Doctor.find(filters)
        .populate('services', servicePopulation)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .lean(),
      Doctor.countDocuments(filters)
    ]);

    return response.json({
      success: true,
      data: doctors,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    return handleDoctorError(error, response);
  }
}

export async function getDoctorById(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({
      success: false,
      message: 'Doctor ID is invalid.'
    });
  }

  const wantsInactive = request.query.includeInactive === 'true';
  if (wantsInactive && request.user?.role !== 'admin') {
    return response.status(403).json({
      success: false,
      message: 'Only administrators can view inactive doctors.'
    });
  }

  const includeInactive = wantsInactive;
  const filters = { _id: request.params.id };
  if (!includeInactive) {
    filters.isActive = true;
  }

  try {
    const doctor = await Doctor.findOne(filters).populate('services', servicePopulation);

    if (!doctor) {
      return response.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    return response.json({ success: true, data: doctor });
  } catch (error) {
    return handleDoctorError(error, response);
  }
}

export async function createDoctor(request, response) {
  const result = getDoctorInput(request.body, false);
  if (result.error) {
    return response.status(400).json({ success: false, message: result.error });
  }

  let servicesAreValid;
  try {
    servicesAreValid = await validateServiceReferences(result.data.services);
  } catch (error) {
    return handleDoctorError(error, response);
  }
  if (!servicesAreValid) {
    return response.status(400).json({
      success: false,
      message: 'One or more selected services do not exist.'
    });
  }

  try {
    const doctor = await Doctor.create(result.data);
    await doctor.populate('services', servicePopulation);
    return response.status(201).json({
      success: true,
      message: 'Doctor created successfully.',
      data: doctor
    });
  } catch (error) {
    return handleDoctorError(error, response);
  }
}

export async function updateDoctor(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({
      success: false,
      message: 'Doctor ID is invalid.'
    });
  }

  const result = getDoctorInput(request.body, true);
  if (result.error) {
    return response.status(400).json({ success: false, message: result.error });
  }

  if (Object.keys(result.data).length === 0) {
    return response.status(400).json({
      success: false,
      message: 'Provide at least one doctor field to update.'
    });
  }

  let servicesAreValid;
  try {
    servicesAreValid = await validateServiceReferences(result.data.services);
  } catch (error) {
    return handleDoctorError(error, response);
  }
  if (!servicesAreValid) {
    return response.status(400).json({
      success: false,
      message: 'One or more selected services do not exist.'
    });
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(request.params.id, result.data, {
      new: true,
      runValidators: true
    }).populate('services', servicePopulation);

    if (!doctor) {
      return response.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    return response.json({
      success: true,
      message: 'Doctor updated successfully.',
      data: doctor
    });
  } catch (error) {
    return handleDoctorError(error, response);
  }
}

export async function deactivateDoctor(request, response) {
  if (!objectIdPattern.test(request.params.id)) {
    return response.status(400).json({
      success: false,
      message: 'Doctor ID is invalid.'
    });
  }

  try {
    const doctor = await Doctor.findByIdAndUpdate(
      request.params.id,
      { isActive: false },
      { new: true, runValidators: true }
    ).populate('services', servicePopulation);

    if (!doctor) {
      return response.status(404).json({
        success: false,
        message: 'Doctor not found.'
      });
    }

    return response.json({
      success: true,
      message: 'Doctor deactivated successfully.',
      data: doctor
    });
  } catch (error) {
    return handleDoctorError(error, response);
  }
}

function getDoctorInput(body, isPartial) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object.' };
  }

  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    return { error: `Unsupported doctor field: ${unknownFields[0]}.` };
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
  const stringFields = [
    'name',
    'email',
    'phone',
    'specialization',
    'qualification',
    'description',
    'profileImage'
  ];

  for (const field of stringFields) {
    if (body[field] === undefined) {
      continue;
    }

    if (typeof body[field] !== 'string') {
      return { error: `${field} must be a string.` };
    }

    const value = body[field].trim();
    if (requiredFields.includes(field) && !value) {
      return { error: `${field} cannot be empty.` };
    }

    if (field === 'email') {
      if (!emailPattern.test(value)) {
        return { error: 'Enter a valid doctor email address.' };
      }
      data.email = value.toLowerCase();
    } else if (field === 'phone' && value && !phonePattern.test(value)) {
      return { error: 'Enter a valid doctor phone number.' };
    } else if (field === 'profileImage' && value) {
      if (value.length > 2048) {
        return { error: 'Profile image URL cannot be longer than 2048 characters.' };
      }
      if (!isSafeImageUrl(value)) {
        return { error: 'Profile image must be an HTTP(S) URL or a local path.' };
      }
    } else {
      data[field] = value;
    }
  }

  for (const [field, minimum, maximum] of [
    ['experience', 0, 80],
    ['consultationFee', 0, Number.MAX_SAFE_INTEGER]
  ]) {
    if (body[field] === undefined) {
      continue;
    }

    if (
      typeof body[field] !== 'number'
      || !Number.isFinite(body[field])
      || body[field] < minimum
      || body[field] > maximum
    ) {
      return { error: `${field} must be a valid number from ${minimum} to ${maximum}.` };
    }

    data[field] = body[field];
  }

  if (body.services !== undefined) {
    if (
      !Array.isArray(body.services)
      || body.services.some(
        (serviceId) => typeof serviceId !== 'string' || !objectIdPattern.test(serviceId)
      )
    ) {
      return { error: 'Services must be an array of valid service IDs.' };
    }

    data.services = [...new Set(body.services)];
  }

  if (body.availableDays !== undefined) {
    if (
      !Array.isArray(body.availableDays)
      || body.availableDays.some((day) => !allowedDays.includes(day))
    ) {
      return { error: 'Available days must contain valid weekday names.' };
    }

    data.availableDays = [...new Set(body.availableDays)];
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return { error: 'isActive must be true or false.' };
    }
    data.isActive = body.isActive;
  }

  return { data };
}

async function validateServiceReferences(serviceIds) {
  if (!serviceIds || serviceIds.length === 0) {
    return true;
  }

  const existingCount = await Service.countDocuments({ _id: { $in: serviceIds } });
  return existingCount === serviceIds.length;
}

function readQueryString(value, response, fieldName) {
  if (value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    response.status(400).json({
      success: false,
      message: `${fieldName} must be a single string value.`
    });
    return null;
  }

  return value.trim();
}

function isSafeImageUrl(value) {
  return /^https?:\/\/\S+$/i.test(value)
    || (value.startsWith('/') && !value.startsWith('//'));
}

function handleDoctorError(error, response) {
  if (error.code === 11000) {
    return response.status(409).json({
      success: false,
      message: 'A doctor with this email address already exists.'
    });
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    return response.status(400).json({
      success: false,
      message: error.message
    });
  }

  console.error('Doctor request failed:', error.message);
  return response.status(500).json({
    success: false,
    message: 'Unable to complete the doctor request right now.'
  });
}
