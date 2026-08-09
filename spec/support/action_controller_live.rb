# Disable the ActionController::Live worker thread inside request specs.
#
# ActionController::Live spawns a real Thread to run the controller action so
# it can stream. That thread checks out its own ActiveRecord connection, which
# is invisible to (and not rolled back by) the main test thread's wrapping
# transaction (`use_transactional_fixtures`). Left as-is, every write the
# streaming action makes (Conversations, Messages, ...) is genuinely
# committed and leaks into every later example in the run — see Rails issue
# #23483, which Rails itself works around for ActionController::TestCase.
# Request specs (ActionDispatch::IntegrationTest) don't get that patch for
# free, so we apply the same fix here: run the "thread" inline.
module ActionController
  module Live
    remove_method :new_controller_thread if method_defined?(:new_controller_thread)

    def new_controller_thread
      yield
    end
  end
end
