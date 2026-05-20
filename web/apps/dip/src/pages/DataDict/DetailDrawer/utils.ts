import intl from 'react-intl-universal';

export const getRules = (
  params
): { max?: number; required?: boolean; message: string }[] => {
  const { dictType, field } = params;

  if (field === 'comment') {
    return [
      {
        max: 3000,
        message: intl.get('dataDict.commentMaximumCharacterLimit')
      }
    ];
  }
  if (dictType === 'kvDict' && field === 'key') {
    return [
      {
        required: true,
        message: intl.get('dataDict.keyNotEmpty')
      },
      {
        max: 3000,
        message: intl.get('dataDict.keyMaximumCharacterLimit')
      }
    ];
  }
  if (dictType === 'kvDict' && field === 'value') {
    return [
      {
        required: true,
        message: intl.get('dataDict.valueNotEmpty')
      },
      {
        max: 3000,
        message: intl.get('dataDict.valueMaximumCharacterLimit')
      }
    ];
  }

  if (field === 'dimensionKey') {
    return [
      {
        max: 3000,
        message: intl.get('dataDict.dimensionKeyMaximumCharacterLimit')
      }
    ];
  }

  if (field === 'dimensionValue') {
    return [
      {
        max: 3000,
        message: intl.get('dataDict.dimensionValueMaximumCharacterLimit')
      }
    ];
  }

  return [];
};
