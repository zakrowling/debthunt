var $addItemForm = document.querySelector('form.add-item')
var $itemsList = document.querySelector('.items .list')
var $clearButton = document.querySelector('[data-action="clear"]')
var $itemCount = document.querySelector('.item-count')

/**
 * With hoodie we're storing our data locally and it will stick around next time you reload.
 * This means each time the page loads we need to find any previous notes that we have stored.
 */
function loadAndRenderItems () {
  hoodie.store.findAll().then(render)
}

/* render items initially on page load */
loadAndRenderItems()

/**
 * Anytime there is a data change we reload and render the list of items
 */
hoodie.store.on('change', loadAndRenderItems)
hoodie.store.on('clear', function () {
  render([])
})

$clearButton.addEventListener('click', function () {
  hoodie.store.removeAll()
})

/**
 * If you submit a form it will emit a submit event.
 * This is better than listening for a click on the submit button for example.
 * It will catch you submitting via pressing 'enter' on a keyboard or something like 'Go' on a mobile keyboard.
 * More info on form accessibility: http://webaim.org/techniques/forms/
 **/

function addMonths(date, months) {
  var d = date.getDate();
  date.setMonth(date.getMonth() + +months);
  if (date.getDate() != d) {
    date.setDate(0);
  }
  return date;
}

function monthDiff(d1, d2) {
  var months;
  months = (d2.getFullYear() - d1.getFullYear()) * 12;
  months -= d1.getMonth();
  months += d2.getMonth();
  return months <= 0 ? 0 : months;
}

$addItemForm.addEventListener('submit', function (event) {
  /**
   * By default a form will submit your form data to the page itself,
   * this is useful if you're doing a traditional web app but we want to handle this in JavaScript instead.
   * if we're overriding this behaviour in JavaScript we need to grab the event
   * and prevent it from doing it's default behaviour.
   **/
  event.preventDefault()

  // Get values from inputs, then clear the form
  var amount = $addItemForm.querySelector('[name=amount]').value
  var note = $addItemForm.querySelector('[name=note]').value
  var debtType = $addItemForm.querySelector('[name=debttype]').value
  var repayment = $addItemForm.querySelector('[name=repayment]').value
  var repaydate = $addItemForm.querySelector('[name=repaydate]').value
  var interest = $addItemForm.querySelector('[name=interest]').value
  note = note.trim()
  $addItemForm.reset()

  hoodie.store.add({
    amount: amount,
    note: note,
    debtType: debtType,
    repayment: repayment,
    repaydate: repaydate,
    interest: interest
  })
})

/**
 * As items are dynamically added an removed, we cannot add event listeners
 * to the buttons. Instead, we register a click event on the items table and
 * then check if one of the buttons was clicked.
 * See: https://davidwalsh.name/event-delegate
 */

$itemsList.addEventListener('click', function (event) {
  event.preventDefault()

  var action = event.target.dataset.action
  if (!action) {
    return
  }

  var row = event.target.parentNode.parentNode
  var id = row.dataset.id
  var note = row.children[0].textContent
  var debtType = row.children[1].textContent
  var amount = row.children[2].textContent
  var repayment = row.children[3].textContent
  var repaydate = row.children[4].textContent
  var interest = row.children[5].textContent

  switch (action) {
    case 'edit':
      row.innerHTML = '<td><input type="text" name="note" value="' + escapeHtml(note) + '" data-reset-value="' + escapeHtml(note) + '"></td>' +
                      '<td><input type="text" name="debttype" value="' + escapeHtml(debtType) + '" data-reset-value="' + escapeHtml(debtType) + '"></td>' +
                      '<td><input type="number" name="amount" step="0.01" value="' + escapeHtml(amount) + '" data-reset-value="' + escapeHtml(amount) + '"></td>' +
                      '<td><input type="number" name="repayment" step="0.01" value="' + escapeHtml(repayment) + '" data-reset-value="' + escapeHtml(repayment) + '"></td>' +
                      '<td><input type="date" name="repaydate" value="' + escapeHtml(repaydate) + '" data-reset-value="' + escapeHtml(repaydate) + '"></td>' +
                      '<td><input type="number" name="interest" step="0.01" value="' + escapeHtml(interest) + '" data-reset-value="' + escapeHtml(interest) + '"></td>' +
                      '<td><a href="#" data-action="update">Save</a></td><td><a href="#" data-action="cancel">Cancel</a></td>';
      // Only allow one item on list to be edited.   Remove edit option on other items in list while editing
      var elements = document.getElementsByClassName('edit')
      while (elements.length > 0) {
        elements[0].remove('edit')
      }
      break
    case 'cancel':
      loadAndRenderItems()
      break

    case 'remove':
      hoodie.store.remove(id)
      break
    case 'update':
      amount = row.querySelector('input[name=amount]').value;
      note = row.querySelector('input[name=note]').value;
      debtType = row.querySelector('input[name=debttype]').value;
      repayment = row.querySelector('input[name=repayment]').value;
      repaydate = row.querySelector('input[name=repaydate]').value;
      interest = row.querySelector('input[name=interest]').value;

      interestRate = interest / 100; // Convert from 2% to 0.02
      monthlyRate = interestRate / 12;
      numberOfPayments = 12;
      var nper1 = Math.log((1-((amount/repayment) * (interestRate/numberOfPayments))));
      var nper2 = Math.log((1+(interestRate/numberOfPayments)));
      nper =-(nper1/nper2);
      interestPaid=repayment*nper-amount;
    
      // Number of months to pay loan from initial month
      nper =-Math.round((nper1/nper2));

      currentDate = new Date();
      repaymentDate = new Date(repaydate);
      if (repaymentDate < currentDate) {  
        // Calculate number of months left on loan since principle was set
        monthlyInterest = interestRate / numberOfPayments;
        remainingAmount = amount;
        remainingInterest = remainingAmount * monthlyInterest;

        for (i = -1; i < monthDiff(repaymentDate,currentDate); i++) { // Set to -1 to account for current month (0)
          // Todo: Remaining amount = remaining amount + monthly interest - repayment
          
          //in-loop interest amount holder
		      var remainingInterest = 0;
		
		      //in-loop monthly principal amount holder
          var monthlyPrincipal = 0;
          
          //calc the in-loop interest amount and display
          remainingInterest = remainingAmount * monthlyRate;
          
          //calc the in-loop monthly principal and display
          monthlyPrincipal = repayment - interest;
          
          //update the balance for each loop iteration
          remainingAmount = remainingAmount - monthlyPrincipal;	
          
          console.log("Balance: " + remainingAmount.toFixed(2) + ", Monthly Principal: " + monthlyPrincipal.toFixed(2) + ", Monthly Interest: " + remainingInterest.toFixed(2));
        }

      }
      console.log("Months Left: " + nper + ", Total Interest To Be Paid: " + interestPaid.toFixed(2) + ", To Be Paid Off By: " + addMonths(repaymentDate,nper.toString()));

      hoodie.store.update(id, {
        amount: amount,
        note: note,
        debtType: debtType,
        repayment: repayment,
        repaydate: repaydate,
        interest: interest
      })
  }
})

function render (items) {
  $itemCount.classList.toggle('hide-item-count', items.length === 0)
  if (items.length === 0) {
    document.body.setAttribute('data-store-state', 'empty')
    return
  }

  document.body.setAttribute('data-store-state', 'not-empty')
  $itemsList.innerHTML = items
    .sort(orderByCreatedAt)
    .map(function (item) {
      return '<tr data-id="' + item._id + '">' +
             '<td>' + escapeHtml(item.note) + '</td>' +
             '<td>' + escapeHtml(item.debtType) + '</td>' +
             '<td>' + escapeHtml(item.amount) + '</td>' +
             '<td>' + escapeHtml(item.repayment) + '</td>' +
             '<td>' + escapeHtml(item.repaydate) + '</td>' +
             '<td>' + escapeHtml(item.interest) + '</td>' +
             '<td><a class="edit" href="#" data-action="edit">Edit</a></td>' +
             '<td><a href="#" data-action="remove">Delete</a></td>' +
             '</tr>'
    }).join('')
  $itemCount.innerHTML = 'List Count: ' + items.length
}

function orderByCreatedAt (item1, item2) {
  var timeA = +new Date(item1.hoodie.createdAt)
  var timeB = +new Date(item2.hoodie.createdAt)
  return timeA < timeB ? 1 : -1
}

function escapeHtml (unsafeHtml) {
  var text = document.createTextNode(unsafeHtml)
  var div = document.createElement('div')
  div.appendChild(text)
  return div.innerHTML
}

/* global hoodie */
