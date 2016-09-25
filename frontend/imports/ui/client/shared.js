import { ViewModel } from 'meteor/manuel:viewmodel';

ViewModel.share({
  newOffer: {
    offerAmount: 0,
    offerPrice: 0,
    offerTotal: 0,
    offerType: '',
    offerError: '',
  },
});
